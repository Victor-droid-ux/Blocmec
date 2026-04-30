//app/api/script/api.js/route.tsx

import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  createScriptToken,
  doesPageMatchBoundDomain,
  normalizeBoundDomain,
  verifyScriptToken,
} from "@/lib/script-token";
import { hasAnyPermission } from "@/lib/developer-policy";

function getLegacyPageReference(request: NextRequest) {
  return {
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
  };
}

async function resolveTokenFromRequest(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const providedToken = searchParams.get("token");

  if (providedToken) {
    const payload = verifyScriptToken(providedToken);
    if (!payload) {
      return { error: "Invalid or expired script token", status: 401 as const };
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: payload.apiKeyId,
        user_id: payload.userId,
        status: "active",
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      select: {
        id: true,
        user_id: true,
        permissions: true,
        allowed_domains: true,
      },
    });

    if (!apiKey) {
      return {
        error: "Active API key not found for this script",
        status: 401 as const,
      };
    }

    if (!hasAnyPermission(apiKey.permissions, ["verify", "qr:read"])) {
      return {
        error: "API key does not have read/verify permission",
        status: 403 as const,
      };
    }

    if (
      Array.isArray(apiKey.allowed_domains) &&
      apiKey.allowed_domains.length > 0 &&
      !apiKey.allowed_domains.includes(payload.domain)
    ) {
      return {
        error: "Token domain is not allowed for this API key",
        status: 403 as const,
      };
    }

    if (
      !doesPageMatchBoundDomain({
        boundDomain: payload.domain,
        ...getLegacyPageReference(request),
      })
    ) {
      return {
        error: "Script domain does not match request origin",
        status: 403 as const,
      };
    }

    return { token: providedToken, domain: payload.domain };
  }

  const legacyKey = searchParams.get("key");
  const legacyDomain = searchParams.get("domain");
  if (!legacyKey || !legacyDomain) {
    return {
      error: "Missing required script token or legacy key/domain parameters",
      status: 400 as const,
    };
  }

  const boundDomain = normalizeBoundDomain(legacyDomain);
  if (
    !doesPageMatchBoundDomain({
      boundDomain,
      ...getLegacyPageReference(request),
    })
  ) {
    return {
      error: "Script domain does not match request origin",
      status: 403 as const,
    };
  }

  let apiKey = null;

  if (legacyKey.startsWith("bm_") && legacyKey.length >= 40) {
    const keyHash = crypto.createHash("sha256").update(legacyKey).digest("hex");
    apiKey = await prisma.apiKey.findFirst({
      where: {
        key_hash: keyHash,
        status: "active",
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      select: {
        id: true,
        user_id: true,
        permissions: true,
        allowed_domains: true,
      },
    });
  } else {
    apiKey = await prisma.apiKey.findFirst({
      where: {
        key_prefix: legacyKey,
        status: "active",
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      select: {
        id: true,
        user_id: true,
        permissions: true,
        allowed_domains: true,
      },
    });
  }

  if (!apiKey) {
    return { error: "Invalid API key reference", status: 401 as const };
  }

  if (!hasAnyPermission(apiKey.permissions, ["verify", "qr:read"])) {
    return {
      error: "API key does not have read/verify permission",
      status: 403 as const,
    };
  }

  if (
    Array.isArray(apiKey.allowed_domains) &&
    apiKey.allowed_domains.length > 0 &&
    !apiKey.allowed_domains.includes(boundDomain)
  ) {
    return {
      error: "Requested domain is not allowed for this API key",
      status: 403 as const,
    };
  }

  return {
    token: createScriptToken({
      apiKeyId: apiKey.id,
      userId: apiKey.user_id,
      domain: boundDomain,
      expiresInSeconds: 60 * 60,
    }),
    domain: boundDomain,
  };
}

export async function GET(request: NextRequest) {
  const resolved = await resolveTokenFromRequest(request);

  if ("error" in resolved) {
    return new NextResponse(resolved.error, { status: resolved.status });
  }

  const origin = request.nextUrl.origin;
  const verificationResultsUrl = `${origin}/verification-results`;
  const verifyEndpoint = `${origin}/api/verify-qr`;
  const cacheDomain = normalizeBoundDomain(resolved.domain);
  const cacheTokenFingerprint = crypto
    .createHash("sha256")
    .update(resolved.token)
    .digest("hex")
    .slice(0, 16);

  const script = `
(function() {
	'use strict';

	const BLOCKMEC_CONFIG = {
		scriptToken: '${resolved.token}',
		domain: '${resolved.domain}',
		verifyEndpoint: '${verifyEndpoint}',
		verificationResultsUrl: '${verificationResultsUrl}'
	};

	function getCurrentPageUrl() {
		return window.location.href;
	}

	function initBlockmecVerification() {
		const urlParams = new URLSearchParams(window.location.search);
		const qrCode = urlParams.get('qr') || urlParams.get('verify');

		if (qrCode) {
			verifyQRCode(qrCode);
		}

		window.addEventListener('blockmec:verify', function(e) {
			if (e.detail && e.detail.qrCode) {
				verifyQRCode(e.detail.qrCode);
			}
		});
	}

	async function verifyQRCode(qrCode) {
		try {
			showLoadingState();

			const response = await fetch(BLOCKMEC_CONFIG.verifyEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Blockmec-Script-Token': BLOCKMEC_CONFIG.scriptToken
				},
				body: JSON.stringify({
					qrData: qrCode,
					domain: BLOCKMEC_CONFIG.domain,
					pageUrl: getCurrentPageUrl()
				})
			});

			const data = await response.json();

			if (data.verified) {
				displayVerificationResult(data);
				window.dispatchEvent(new CustomEvent('blockmec:verified', { detail: data }));
			} else {
				displayErrorState(data.message || 'Verification failed');
			}
		} catch (error) {
			console.error('Blockmec verification error:', error);
			displayErrorState('Unable to verify product. Please try again.');
		}
	}

	function showLoadingState() {
		const container = getOrCreateContainer();
		container.innerHTML = \
			'<div class="blockmec-loading">' +
			'<div class="blockmec-spinner"></div>' +
			'<p>Verifying product...</p>' +
			'</div>';
		container.style.display = 'block';
	}

	function displayVerificationResult(data) {
		const container = getOrCreateContainer();
		container.innerHTML = \
			'<div class="blockmec-result ' + (data.verified ? 'verified' : 'failed') + '">' +
				'<div class="blockmec-header">' +
					'<div class="blockmec-icon">' + (data.verified ? '✓' : '✗') + '</div>' +
					'<h2>' + (data.data?.productName || data.productName || 'Verification Result') + '</h2>' +
				'</div>' +
				'<div class="blockmec-details">' +
					'<div class="blockmec-badge ' + (data.verified ? 'success' : 'error') + '">' +
						(data.verified ? 'Verified Product' : 'Verification Failed') +
					'</div>' +
					'<div class="blockmec-info">' +
						infoRow('Token ID', data.data?.tokenId || data.tokenId || 'N/A') +
						infoRow('Scan Count', String(data.data?.scanCount || data.scanCount || 0)) +
						infoRow('Product Type', data.data?.productType || data.productType || 'N/A') +
						infoRow('Issuer', data.data?.issuer || data.issuer || 'N/A') +
					'</div>' +
					'<div class="blockmec-actions">' +
						'<a href="' + BLOCKMEC_CONFIG.verificationResultsUrl + '?data=' + encodeURIComponent(JSON.stringify(data)) + '" target="_blank" class="blockmec-btn blockmec-btn-primary">View Full Details</a>' +
						'<button type="button" class="blockmec-btn blockmec-btn-secondary" onclick="window.location.reload()">Verify Another</button>' +
					'</div>' +
				'</div>' +
				'<div class="blockmec-footer">Powered by <a href="https://blockmec.org" target="_blank">Blockmec</a></div>' +
			'</div>';
	}

	function infoRow(label, value) {
		return '<div class="blockmec-info-item"><span class="label">' + label + ':</span><span class="value">' + value + '</span></div>';
	}

	function displayErrorState(message) {
		const container = getOrCreateContainer();
		container.innerHTML = \
			'<div class="blockmec-result error">' +
				'<div class="blockmec-header">' +
					'<div class="blockmec-icon error">⚠</div>' +
					'<h2>Verification Error</h2>' +
				'</div>' +
				'<div class="blockmec-details">' +
					'<p class="blockmec-error-message">' + message + '</p>' +
					'<button type="button" onclick="window.location.reload()" class="blockmec-btn blockmec-btn-primary">Try Again</button>' +
				'</div>' +
			'</div>';
	}

	function getOrCreateContainer() {
		let container = document.getElementById('blockmec-verification-widget');
		if (!container) {
			container = document.createElement('div');
			container.id = 'blockmec-verification-widget';
			document.body.appendChild(container);
			injectStyles();
		}
		return container;
	}

	function injectStyles() {
		if (document.getElementById('blockmec-styles')) return;

		const style = document.createElement('style');
		style.id = 'blockmec-styles';
		style.textContent = \
			'#blockmec-verification-widget{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;max-width:600px;margin:20px auto;padding:20px;}' +
			'.blockmec-result{background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);overflow:hidden;}' +
			'.blockmec-header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:30px;text-align:center;}' +
			'.blockmec-icon{width:60px;height:60px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 15px;}' +
			'.blockmec-icon.error{background:rgba(239,68,68,.2);}' +
			'.blockmec-details{padding:30px;}' +
			'.blockmec-badge{display:inline-block;padding:8px 16px;border-radius:20px;font-weight:600;font-size:14px;margin-bottom:20px;}' +
			'.blockmec-badge.success{background:#d1fae5;color:#065f46;}' +
			'.blockmec-badge.error{background:#fee2e2;color:#991b1b;}' +
			'.blockmec-info{background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:20px;}' +
			'.blockmec-info-item{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e7eb;gap:16px;}' +
			'.blockmec-info-item:last-child{border-bottom:none;}' +
			'.blockmec-info-item .label{color:#6b7280;font-weight:500;}' +
			'.blockmec-info-item .value{color:#111827;font-weight:600;text-align:right;}' +
			'.blockmec-actions{display:flex;gap:10px;margin-top:20px;}' +
			'.blockmec-btn{flex:1;padding:12px 24px;border-radius:8px;font-weight:600;text-align:center;text-decoration:none;border:none;cursor:pointer;transition:all .2s;}' +
			'.blockmec-btn-primary{background:#667eea;color:#fff;}' +
			'.blockmec-btn-secondary{background:#f3f4f6;color:#374151;}' +
			'.blockmec-footer{text-align:center;padding:20px;background:#f9fafb;font-size:12px;color:#6b7280;}' +
			'.blockmec-loading{text-align:center;padding:60px 20px;}' +
			'.blockmec-spinner{width:50px;height:50px;border:4px solid #f3f4f6;border-top:4px solid #667eea;border-radius:50%;animation:blockmec-spin 1s linear infinite;margin:0 auto 20px;}' +
			'.blockmec-error-message{text-align:center;color:#991b1b;font-size:16px;margin:20px 0;}' +
			'@keyframes blockmec-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}' +
			'@media (max-width:640px){.blockmec-actions{flex-direction:column;}}';
		document.head.appendChild(style);
	}

	window.Blockmec = {
		verify: function(qrCode) {
			verifyQRCode(qrCode);
		},
		config: {
			domain: BLOCKMEC_CONFIG.domain
		}
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initBlockmecVerification);
	} else {
		initBlockmecVerification();
	}
})();
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=300",
      "Vary": "Origin, Referer, Accept-Encoding, X-Blockmec-Script-Token, X-Blockmec-Domain",
      "X-Blockmec-Cache-Key": `${cacheDomain}:${cacheTokenFingerprint}`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
