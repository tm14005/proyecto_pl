<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

class LPController extends Controller
{
    public function resolverLP(Request $request)
    {
        $data = $request->json()->all();
        $response = Http::post('http://127.0.0.1:5000/resolver-lp', $data);

        if ($response->failed()) {
            return response()->json([
                'estado' => 'Error',
                'mensaje' => 'Error al conectar con el backend Python',
                'detalle' => $response->body()
            ], 500);
        }
        return response()->json($response->json());
    }
}
