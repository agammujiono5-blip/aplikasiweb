<?php

namespace Tests\Feature;

use Tests\TestCase;

class ErrorPageTest extends TestCase
{
    public function test_handled_error_codes_render_blade_page_with_correct_status(): void
    {
        $codes = [400, 401, 402, 403, 404, 405, 408, 409, 413, 419, 422, 429, 500, 501, 502, 503, 504];

        foreach ($codes as $code) {
            $response = $this->get("/errors/{$code}");

            $response->assertStatus($code);
            $response->assertSee('Error ' . $code, false);
            $response->assertSee('data-code="' . $code . '"', false);
        }
    }

    public function test_404_page_uses_ghost_copy(): void
    {
        $this->get('/errors/404')
            ->assertStatus(404)
            ->assertSee('Waduh! Halaman tidak ditemukan.');
    }

    public function test_retry_button_only_shown_for_retryable_codes(): void
    {
        $this->get('/errors/503')->assertSee('Muat Ulang');
        $this->get('/errors/404')->assertDontSee('Muat Ulang');
    }

    public function test_401_and_403_show_login_button_without_back_button(): void
    {
        foreach ([401, 403] as $code) {
            $response = $this->get("/errors/{$code}");
            $response->assertSee('Masuk ke Akun');
            $response->assertDontSee('Halaman Sebelumnya');
        }
    }

    public function test_unsupported_code_falls_back_to_404(): void
    {
        $this->get('/errors/599')->assertNotFound();
        $this->get('/errors/abc')->assertNotFound();
    }

    public function test_unknown_web_route_renders_404_error_page(): void
    {
        $response = $this->get('/halaman-yang-tidak-ada');

        $response->assertNotFound();
        $response->assertSee('data-code="404"', false);
        $response->assertSee('Error 404', false);
    }

    public function test_api_requests_still_receive_json_errors(): void
    {
        $response = $this->getJson('/api/tidak-ada');

        $response->assertNotFound();
        $response->assertHeader('content-type', 'application/json');
        $response->assertJsonStructure(['message']);
    }

    public function test_unhandled_exception_web_request_renders_500_page(): void
    {
        \Illuminate\Support\Facades\Route::get('/boom-khusus-test', function () {
            throw new \RuntimeException('Backend rusak');
        });

        $response = $this->get('/boom-khusus-test');

        $response->assertStatus(500);
        $response->assertSee('data-code="500"', false);
        $response->assertDontSee('Backend rusak');
    }
}
