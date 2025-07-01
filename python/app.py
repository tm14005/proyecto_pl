from flask import Flask, request, jsonify
from solver import resolver_pl

app = Flask(__name__)

@app.route('/solve', methods=['POST'])
def solve():
    data = request.get_json()
    # Recibe: data['funcion_objetivo'] y data['restricciones']
    funcion_objetivo = data.get('funcion_objetivo')
    restricciones = data.get('restricciones')
    result = resolver_pl(funcion_objetivo, restricciones)
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
