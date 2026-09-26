<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $notifications = Cache::remember("notif_list_{$userId}", 60, function () use ($userId) {
            return Notification::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->toArray();
        });

        return response()->json([
            'status' => 'success',
            'data' => $notifications,
        ]);
    }

    /**
     * Get unread count for badge display.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $count = Cache::remember("notif_unread_{$userId}", 30, function () use ($userId) {
            return Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->count();
        });

        return response()->json([
            'status' => 'success',
            'count' => $count,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;
        $notification = Notification::where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        Cache::forget("notif_unread_{$userId}");
        Cache::forget("notif_list_{$userId}");

        return response()->json([
            'status' => 'success',
            'message' => 'Notifikasi telah ditandai dibaca.',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        Cache::forget("notif_unread_{$userId}");
        Cache::forget("notif_list_{$userId}");

        return response()->json([
            'status' => 'success',
            'message' => 'Semua notifikasi telah ditandai dibaca.',
        ]);
    }
}
