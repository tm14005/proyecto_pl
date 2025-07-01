<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

class LPController extends Controller
{
    public function resolver(Request $request)
    {
        $objetivo = $request->input('funcion_objetivo');
        $restricciones_text = $request->input('restricciones');

        if(empty($objetivo) || empty($restricciones_text)) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Ambos campos son obligatorios.'
            ], 400);
        }

        $restricciones = array_filter(array_map('trim', explode("\n", $restricciones_text)));

        $data = [
            'funcion_objetivo' => $objetivo,
            'restricciones' => $restricciones
        ];

        try {
            $response = Http::timeout(10)->post('http://localhost:5000/solve', $data);
            if (!$response->successful()) {
                return response()->json([
                    'status' => 'Error',
                    'message' => 'Error al consultar la API de Python.',
                    'api_response' => $response->body()
                ], 500);
            }
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'Error',
                'message' => 'No se pudo conectar a la API de Python: ' . $e->getMessage()
            ], 500);
        }
    }
}
