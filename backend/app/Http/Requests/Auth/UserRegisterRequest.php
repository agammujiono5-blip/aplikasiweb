<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rules\Password;

class UserRegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     * SQL Injection prevention: Strict validation rules and typed inputs.
     * Hashcat prevention: Strong password requirement (min 8 chars, mixed case, numbers, symbols).
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'nim' => ['required', 'string', 'max:30', 'regex:/^[a-zA-Z0-9\-\.]+$/', 'unique:users,nim'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9\+\-\s]+$/'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ];
    }

    /**
     * Custom messages for validation.
     */
    public function messages(): array
    {
        return [
            'nim.unique' => 'NIM ini sudah terdaftar dalam sistem.',
            'nim.regex' => 'Format NIM hanya boleh berisi huruf, angka, titik, atau tanda hubung.',
            'email.unique' => 'Email ini sudah terdaftar dalam sistem.',
            'email.email' => 'Format email tidak valid.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'password' => 'Kata sandi minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, dan simbol untuk keamanan maksimal.',
        ];
    }

    /**
     * Ensure JSON response for API validation errors.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => 'error',
            'message' => 'Validasi gagal. Periksa kembali data yang Anda masukkan.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
