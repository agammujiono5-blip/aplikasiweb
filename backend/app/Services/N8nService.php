<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class N8nService
{
    /**
     * Queue a peminjaman payload to the n8n webhook without blocking the HTTP response.
     * The request is dispatched after the response is sent to the user.
     *
     * @param  array<string, mixed>  $data
     */
    public function sendPeminjaman(array $data): bool
    {
        $url = config('services.n8n.webhook_url');
        $secret = config('services.n8n.webhook_secret');

        if (! $url || ! $secret) {
            Log::warning('N8N webhook URL atau secret belum dikonfigurasi.');

            return false;
        }

        dispatch(function () use ($url, $secret, $data) {
            try {
                $response = Http::acceptJson()
                    ->withHeaders([
                        'X-Webhook-Secret' => $secret,
                    ])
                    ->timeout(5)
                    ->connectTimeout(3)
                    ->post($url, $data);

                if (! $response->successful()) {
                    Log::warning('N8N webhook gagal menerima data.', [
                        'status' => $response->status(),
                        'response' => $response->body(),
                    ]);

                    return;
                }

                Log::info('N8N webhook berhasil menerima pengajuan peminjaman.', [
                    'ticket_number' => $data['ticket_number'] ?? null,
                ]);
            } catch (\Throwable $e) {
                Log::error('Gagal mengirim pengajuan ke N8N.', [
                    'error' => $e->getMessage(),
                ]);
            }
        })->afterResponse();

        return true;
    }
}
