<!doctype html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Error {{ $code }} &middot; {{ $name }}</title>

    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">

    <style>
        :root {
            --primary: #4b3f9e;
            --primary-dark: #342586;
            --ease: cubic-bezier(0.43, 0.13, 0.23, 0.96);
        }

        *,
        *::before,
        *::after {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2.5rem 1rem;
            background: #ffffff;
            color: #111827;
            font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
            -webkit-font-smoothing: antialiased;
        }

        .stage {
            width: 100%;
            max-width: 36rem;
            text-align: center;
            animation: rise 0.7s var(--ease) both;
        }

        .code {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            margin-bottom: 2rem;
            user-select: none;
        }

        .code__digit {
            font-size: clamp(4rem, 18vw, 7.5rem);
            font-weight: 800;
            line-height: 1;
            color: var(--primary);
            opacity: 0;
        }

        .code__digit--left {
            animation: slide-left 0.8s var(--ease) 0.1s forwards;
        }

        .code__digit--right {
            animation: slide-right 0.8s var(--ease) 0.1s forwards;
        }

        .code__digit--middle {
            font-size: clamp(2rem, 9vw, 3.75rem);
            opacity: 0;
            animation: fade-in 0.8s var(--ease) 0.2s forwards;
        }

        .code__ghost {
            width: clamp(4.5rem, 16vw, 7.5rem);
            height: clamp(4.5rem, 16vw, 7.5rem);
            border-radius: 9999px;
            background: rgba(75, 63, 158, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            animation: fade-in 0.6s var(--ease) 0.25s both, float 2s ease-in-out 0.85s infinite alternate;
            transition: transform 0.6s var(--ease);
        }

        .code__ghost svg {
            width: 58%;
            height: 58%;
            color: var(--primary);
        }

        .code__ghost:hover {
            animation: fade-in 0.6s var(--ease) both, float-pause 0.6s var(--ease) forwards;
            transform: translateY(-10px) scale(1.1);
        }

        .status {
            margin: 0 0 0.5rem;
            font-size: 0.6875rem;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(75, 63, 158, 0.7);
        }

        h1 {
            margin: 0 0 1rem;
            font-size: clamp(1.5rem, 4vw, 2.25rem);
            font-weight: 700;
            line-height: 1.25;
            color: #111827;
        }

        .description {
            margin: 0 0 0.75rem;
            font-size: clamp(0.95rem, 2.2vw, 1.125rem);
            line-height: 1.65;
            color: #6b7280;
        }

        .hint {
            margin: 0 0 2.25rem;
            font-size: 0.875rem;
            color: #9ca3af;
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            height: 48px;
            padding: 0 1.75rem;
            border-radius: 9999px;
            border: 1px solid transparent;
            font-family: inherit;
            font-size: 0.875rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: transform 0.25s var(--ease), background-color 0.2s, box-shadow 0.2s;
        }

        .btn:hover {
            transform: scale(1.04);
        }

        .btn:active {
            transform: scale(0.96);
        }

        .btn:focus-visible {
            outline: 2px solid rgba(75, 63, 158, 0.4);
            outline-offset: 3px;
        }

        .btn--primary {
            background: var(--primary);
            color: #ffffff;
            box-shadow: 0 10px 25px -8px rgba(75, 63, 158, 0.55);
        }

        .btn--primary:hover {
            background: var(--primary-dark);
        }

        .btn--ghost {
            background: #ffffff;
            color: #374151;
            border-color: #e5e7eb;
        }

        .btn--ghost:hover {
            background: #f9fafb;
        }

        .btn svg {
            width: 1rem;
            height: 1rem;
        }

        .links {
            margin-top: 2.5rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 1.25rem;
        }

        .links a {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.875rem;
            color: #9ca3af;
            text-decoration: underline;
            text-underline-offset: 4px;
            transition: color 0.2s;
        }

        .links a:hover {
            color: var(--primary);
        }

        .links svg {
            width: 1rem;
            height: 1rem;
        }

        @keyframes rise {
            from {
                opacity: 0;
                transform: translateY(30px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slide-left {
            from {
                opacity: 0;
                transform: translate(-40px, 15px) rotate(-5deg);
            }

            to {
                opacity: 0.85;
                transform: translate(0, 0) rotate(0);
            }
        }

        @keyframes slide-right {
            from {
                opacity: 0;
                transform: translate(40px, 15px) rotate(5deg);
            }

            to {
                opacity: 0.85;
                transform: translate(0, 0) rotate(0);
            }
        }

        @keyframes fade-in {
            from {
                opacity: 0;
                transform: scale(0.8);
            }

            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes float {
            from {
                transform: translateY(-6px);
            }

            to {
                transform: translateY(6px);
            }
        }

        @keyframes float-pause {
            to {
                transform: translateY(0);
            }
        }

        @media (prefers-reduced-motion: reduce) {

            *,
            *::before,
            *::after {
                animation: none !important;
                transition: none !important;
            }

            .code__digit,
            .code__digit--middle {
                opacity: 0.85;
            }
        }
    </style>
</head>

<body>
    <main class="stage" data-code="{{ $code }}">
        <div class="code" aria-hidden="true">
            <span class="code__digit code__digit--left">{{ mb_substr((string) $code, 0, 1) }}</span>
            <span class="code__ghost">
                {{-- lucide: ghost --}}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 10h.01" />
                    <path d="M15 10h.01" />
                    <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
                </svg>
            </span>
            @php
                $digits = (string) $code;
                $middle = substr($digits, 1, max(0, strlen($digits) - 2));
                $last = strlen($digits) > 1 ? substr($digits, -1) : '';
            @endphp
            @if ($middle !== '')
                <span class="code__digit code__digit--middle">{{ $middle }}</span>
            @endif
            <span class="code__digit code__digit--right">{{ $last }}</span>
        </div>

        <p class="status">Error {{ $code }} &middot; {{ $name }}</p>
        <h1>{{ $title }}</h1>
        <p class="description">{{ $description }}</p>
        @if (filled($hint ?? null))
            <p class="hint">{{ $hint }}</p>
        @endif

        <div class="actions">
            <a class="btn btn--primary" href="{{ $homeUrl }}">
                @if ($isLogin)
                    {{-- lucide: log-in --}}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Masuk ke Akun
                @else
                    {{-- lucide: home --}}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Kembali ke Beranda
                @endif
            </a>

            @if ($retry)
                <button class="btn btn--ghost" type="button" onclick="window.location.reload()">
                    {{-- lucide: refresh-cw --}}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M8 16H3v5" />
                    </svg>
                    Muat Ulang
                </button>
            @endif

            @if (!$isLogin)
                <button class="btn btn--ghost" type="button" onclick="history.length > 1 ? history.back() : location.assign('{{ $homeUrl }}')">
                    {{-- lucide: arrow-left --}}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                    </svg>
                    Halaman Sebelumnya
                </button>
            @endif
        </div>

        <div class="links">
            <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/{{ $code }}"
                target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="m13.5 8.5-5 5L22 22" />
                    <path d="M13 13H8a2 2 0 0 1-2-2v-2" />
                    <path d="M13 13V6a2 2 0 0 1 2-2h2" />
                    <path d="M7 21h5" />
                    <path d="m21 3-7.5 7.5" />
                </svg>
                Apa arti {{ $code }}?
            </a>
            <a href="mailto:{{ config('mail.from.address', 'admin@example.ac.id') }}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m4.93 4.93 14.14 14.14" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                </svg>
                Laporkan
            </a>
        </div>
    </main>
</body>

</html>
