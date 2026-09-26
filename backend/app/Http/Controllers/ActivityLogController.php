<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ActivityLogController extends Controller
{
    /**
     * Get activity logs for admin (latest 200 entries, searchable).
     * High-speed cache for instant activity log browsing.
     */
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->input('search', ''));
        $action = trim((string) $request->input('action', ''));
        $cacheKey = 'activity_logs_' . md5($search . '_' . $action);

        $logs = Cache::remember($cacheKey, 30, function () use ($search, $action) {
            $query = ActivityLog::with('admin')
                ->orderBy('created_at', 'desc');

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('action', 'like', "%{$search}%")
                      ->orWhereHas('admin', fn($aq) => $aq->where('name', 'like', "%{$search}%"));
                });
            }

            if (!empty($action)) {
                $query->where('action', $action);
            }

            return $query->limit(200)->get()->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'subject_type' => $log->subject_type,
                    'subject_id' => $log->subject_id,
                    'meta' => $log->meta,
                    'admin_name' => $log->admin?->name ?? 'System',
                    'created_at' => $log->created_at,
                ];
            })->values()->all();
        });

        return response()->json([
            'status' => 'success',
            'data' => $logs,
        ]);
    }
}
