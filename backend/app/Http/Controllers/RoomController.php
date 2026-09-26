<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RoomController extends Controller
{
    /**
     * Get all rooms. Available for both Admin and Penyewa.
     * Cached for fast responses; automatically cleared on updates.
     */
    public function index(): JsonResponse
    {
        $rooms = Cache::remember('rooms_list_with_count', 120, function () {
            return Room::withCount('peminjamans')
                ->orderBy('id', 'asc')
                ->get()
                ->toArray();
        });

        return response()->json([
            'status' => 'success',
            'data' => $rooms,
        ]);
    }

    /**
     * Store a new room (Admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:rooms,name',
            'gedung' => 'required|string|max:255',
            'kapasitas' => 'required|integer|min:1',
            'fasilitas' => 'nullable|array',
            'status' => 'nullable|in:tersedia,terpakai,maintenance',
        ]);

        $validated['fasilitas'] = $validated['fasilitas'] ?? [];
        $validated['status'] = $validated['status'] ?? 'tersedia';
        $validated['peminjaman_count'] = 0;

        $room = Room::create($validated);
        PeminjamanController::flushPeminjamanCache();

        return response()->json([
            'status' => 'success',
            'message' => 'Ruangan berhasil ditambahkan.',
            'data' => $room,
        ], 201);
    }

    /**
     * Update room details (Admin only).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $room = Room::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:rooms,name,' . $room->id,
            'gedung' => 'required|string|max:255',
            'kapasitas' => 'required|integer|min:1',
            'fasilitas' => 'nullable|array',
            'status' => 'nullable|in:tersedia,terpakai,maintenance',
        ]);

        $room->update($validated);
        PeminjamanController::flushPeminjamanCache();

        return response()->json([
            'status' => 'success',
            'message' => 'Ruangan berhasil diperbarui.',
            'data' => $room,
        ]);
    }

    /**
     * Toggle or update room availability status (Admin only).
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $room = Room::findOrFail($id);

        if ($request->has('status') && in_array($request->input('status'), ['tersedia', 'terpakai', 'maintenance'])) {
            $room->status = $request->input('status');
        } else {
            $cycle = [
                'tersedia' => 'maintenance',
                'maintenance' => 'tersedia',
                'terpakai' => 'tersedia',
            ];
            $room->status = $cycle[$room->status] ?? 'tersedia';
        }

        $room->save();
        PeminjamanController::flushPeminjamanCache();

        return response()->json([
            'status' => 'success',
            'message' => "Status ruangan diubah menjadi {$room->status}.",
            'data' => $room,
        ]);
    }

    /**
     * Delete room (Admin only).
     */
    public function destroy(int $id): JsonResponse
    {
        $room = Room::findOrFail($id);
        $room->delete();
        PeminjamanController::flushPeminjamanCache();

        return response()->json([
            'status' => 'success',
            'message' => 'Ruangan berhasil dihapus.',
        ]);
    }
}
