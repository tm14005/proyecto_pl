import re
import numpy as np
from collections import defaultdict
from scipy.optimize import linprog

def parsear_restriccion(restriccion):
    """Convierte una restricción como 'x + 2y <= 14' a coeficientes, operador y lado derecho."""
    m = re.match(r'\s*(.*?)\s*(<=|>=|=|<|>)\s*(.*?)\s*$', restriccion)
    if not m:
        raise ValueError(f"Restricción mal formada: {restriccion}")
    izquierda, operador, derecha = m.groups()
    izquierda = re.sub(r'([+\-])\s+', r'\1', izquierda)
    izquierda = izquierda.replace('-', '+-')
    terminos = izquierda.split('+')
    coeficientes = defaultdict(float)
    for termino in terminos:
        termino = termino.strip()
        if not termino:
            continue
        m2 = re.match(r'^([\-]?\d*\.?\d*)?([a-zA-Z]\w*)$', termino)
        if not m2:
            raise ValueError(f"Término mal formado: '{termino}' en '{restriccion}'")
        factor, variable = m2.groups()
        if factor in ('', '+'):
            factor = 1.0
        elif factor == '-':
            factor = -1.0
        else:
            factor = float(factor)
        coeficientes[variable] += factor
    lado_derecho = float(derecha)
    return dict(coeficientes), operador, lado_derecho

def obtener_region_factible(restricciones):
    """Calcula los vértices del polígono factible."""
    lineas = []
    for restriccion in restricciones:
        coef, operador, rhs = parsear_restriccion(restriccion)
        a = coef.get('x', 0)
        b = coef.get('y', 0)
        lineas.append((a, b, operador, rhs))
    puntos = []
    for i in range(len(lineas)):
        a1, b1, _, c1 = lineas[i]
        for j in range(i + 1, len(lineas)):
            a2, b2, _, c2 = lineas[j]
            A = np.array([[a1, b1], [a2, b2]])
            if np.linalg.matrix_rank(A) < 2:
                continue
            B = np.array([c1, c2])
            try:
                x, y = np.linalg.solve(A, B)
            except np.linalg.LinAlgError:
                continue
            factible = True
            for a, b, op, rhs in lineas:
                val = a * x + b * y
                if op == '<=' and not (val <= rhs + 1e-7): factible = False; break
                elif op == '>=' and not (val >= rhs - 1e-7): factible = False; break
                elif op == '='  and not (abs(val - rhs) < 1e-7): factible = False; break
                elif op == '<'  and not (val < rhs - 1e-7): factible = False; break
                elif op == '>'  and not (val > rhs + 1e-7): factible = False; break
            if factible:
                puntos.append((float(np.round(x, 8)), float(np.round(y, 8))))
    # Intersección con los ejes
    for a, b, op, rhs in lineas:
        if b != 0:
            x, y = 0, rhs / b if a == 0 else (rhs - a * 0) / b
            if np.isfinite(y):
                factible = True
                for a2, b2, op2, rhs2 in lineas:
                    val = a2 * x + b2 * y
                    if op2 == '<=' and not (val <= rhs2 + 1e-7): factible = False; break
                    elif op2 == '>=' and not (val >= rhs2 - 1e-7): factible = False; break
                    elif op2 == '='  and not (abs(val - rhs2) < 1e-7): factible = False; break
                    elif op2 == '<'  and not (val < rhs2 - 1e-7): factible = False; break
                    elif op2 == '>'  and not (val > rhs2 + 1e-7): factible = False; break
                if factible:
                    puntos.append((float(np.round(x, 8)), float(np.round(y, 8))))
        if a != 0:
            y, x = 0, rhs / a if b == 0 else (rhs - b * 0) / a
            if np.isfinite(x):
                factible = True
                for a2, b2, op2, rhs2 in lineas:
                    val = a2 * x + b2 * y
                    if op2 == '<=' and not (val <= rhs2 + 1e-7): factible = False; break
                    elif op2 == '>=' and not (val >= rhs2 - 1e-7): factible = False; break
                    elif op2 == '='  and not (abs(val - rhs2) < 1e-7): factible = False; break
                    elif op2 == '<'  and not (val < rhs2 - 1e-7): factible = False; break
                    elif op2 == '>'  and not (val > rhs2 + 1e-7): factible = False; break
                if factible:
                    puntos.append((float(np.round(x, 8)), float(np.round(y, 8))))
    # Elimina duplicados y puntos negativos
    unicos = []
    for p in puntos:
        if p[0] < -1e-7 or p[1] < -1e-7:
            continue
        if any(np.allclose(p, q, atol=1e-7) for q in unicos):
            continue
        unicos.append(p)
    # Ordena los puntos para trazar el polígono
    if len(unicos) > 2:
        cx = sum(x for x, y in unicos) / len(unicos)
        cy = sum(y for x, y in unicos) / len(unicos)
        unicos.sort(key=lambda p: np.arctan2(p[1] - cy, p[0] - cx))
    return unicos

def obtener_segmentos_restricciones(restricciones, lim_x=(0, 20), lim_y=(0, 20)):
    """Obtiene los extremos de cada restricción para graficar la línea."""
    segmentos = []
    for restriccion in restricciones:
        coef, _, rhs = parsear_restriccion(restriccion)
        a = coef.get('x', 0)
        b = coef.get('y', 0)
        puntos = []
        for x in lim_x:
            if b != 0:
                y = (rhs - a * x) / b
                if lim_y[0] - 1e-3 <= y <= lim_y[1] + 1e-3:
                    puntos.append([x, float(np.round(y, 8))])
        for y in lim_y:
            if a != 0:
                x = (rhs - b * y) / a
                if lim_x[0] - 1e-3 <= x <= lim_x[1] + 1e-3:
                    puntos.append([float(np.round(x, 8)), y])
        if len(puntos) >= 2:
            puntos = sorted(puntos, key=lambda pt: (pt[0], pt[1]))
            segmentos.append([puntos[0], puntos[-1]])
    return segmentos

def obtener_segmento_objetivo(funcion_objetivo, optimo, lim_x=(0, 20), lim_y=(0, 20)):
    """Devuelve el segmento de la función objetivo en el óptimo para graficar."""
    m = re.match(r'(max|min)\s*:\s*(.*)', funcion_objetivo.strip(), re.IGNORECASE)
    if not m: return None
    expr = m.group(2)
    coef = defaultdict(float)
    expr = expr.replace('-', '+-')
    terminos = expr.split('+')
    for termino in terminos:
        termino = termino.strip()
        if not termino: continue
        m2 = re.match(r'^([\-]?\d*\.?\d*)?([a-zA-Z]\w*)$', termino)
        if not m2: continue
        factor, variable = m2.groups()
        if factor in ('', '+'): factor = 1.0
        elif factor == '-': factor = -1.0
        else: factor = float(factor)
        coef[variable] += factor
    a = coef.get('x', 0)
    b = coef.get('y', 0)
    z = a * optimo['x'] + b * optimo['y'] if optimo and 'x' in optimo and 'y' in optimo else 0
    puntos = []
    for x in lim_x:
        if b != 0:
            y = (z - a * x) / b
            if lim_y[0] - 1e-3 <= y <= lim_y[1] + 1e-3:
                puntos.append([x, float(np.round(y, 8))])
    for y in lim_y:
        if a != 0:
            x = (z - b * y) / a
            if lim_x[0] - 1e-3 <= x <= lim_x[1] + 1e-3:
                puntos.append([float(np.round(x, 8)), y])
    if len(puntos) >= 2:
        puntos = sorted(puntos, key=lambda pt: (pt[0], pt[1]))
        return [puntos[0], puntos[-1]]
    return None

def resolver_pl(funcion_objetivo, restricciones):
    """Resuelve el PL y retorna datos para graficar en Chart.js."""
    obj_match = re.match(r'(max|min)\s*:\s*(.*)', funcion_objetivo.strip(), re.IGNORECASE)
    if not obj_match:
        return {'error': "Función objetivo mal escrita"}
    sentido, expr = obj_match.groups()
    coef = defaultdict(float)
    expr = expr.replace('-', '+-')
    terminos = expr.split('+')
    for termino in terminos:
        termino = termino.strip()
        if not termino: continue
        m2 = re.match(r'^([\-]?\d*\.?\d*)?([a-zA-Z]\w*)$', termino)
        if not m2:
            return {'error': f"Error en término de función objetivo: '{termino}'"}
        factor, variable = m2.groups()
        if factor in ('', '+'): factor = 1.0
        elif factor == '-': factor = -1.0
        else: factor = float(factor)
        coef[variable] += factor
    nombres_var = sorted(coef.keys())
    if len(nombres_var) != 2 or not all(v in nombres_var for v in ('x', 'y')):
        return {'error': "Solo se soportan problemas con dos variables (x, y)"}
    c = [coef['x'], coef['y']]

    # Construye las matrices para linprog
    A_ub, b_ub, A_eq, b_eq = [], [], [], []
    for restr in restricciones:
        cc, op, rhs = parsear_restriccion(restr)
        fila = [cc.get('x', 0), cc.get('y', 0)]
        if op == '<=':
            A_ub.append(fila); b_ub.append(rhs)
        elif op == '>=':
            A_ub.append([-fila[0], -fila[1]]); b_ub.append(-rhs)
        elif op == '=':
            A_eq.append(fila); b_eq.append(rhs)
        elif op == '<':
            A_ub.append(fila); b_ub.append(rhs - 1e-7)
        elif op == '>':
            A_ub.append([-fila[0], -fila[1]]); b_ub.append(-rhs - 1e-7)
        else:
            return {'error': f"Operador no soportado: {op}"}

    sentido_linprog = 1 if sentido.lower() == 'min' else -1
    res = linprog(
        c=[sentido_linprog * x for x in c],
        A_ub=A_ub if A_ub else None,
        b_ub=b_ub if b_ub else None,
        A_eq=A_eq if A_eq else None,
        b_eq=b_eq if b_eq else None,
        bounds=[(0, None), (0, None)],
        method='highs'
    )

    region = obtener_region_factible(restricciones)
    segmentos_restriccion = obtener_segmentos_restricciones(restricciones)
    optimo = None
    estado = 'Infactible'
    variables = {}
    objetivo = None

    if res.success:
        x_opt, y_opt = res.x
        optimo = {'x': float(np.round(x_opt, 8)), 'y': float(np.round(y_opt, 8))}
        variables = {'x': float(np.round(x_opt, 8)), 'y': float(np.round(y_opt, 8))}
        val = sum([c[i]*res.x[i] for i in range(2)])
        if sentido.lower() == 'max':
            val = -val
        objetivo = float(np.round(val, 8))
        estado = 'Optimo'
    else:
        estado = res.message

    segmento_objetivo = obtener_segmento_objetivo(funcion_objetivo, optimo)

    resultado = {
        'objective': objetivo,
        'optimum': optimo,
        'status': estado,
        'variables': variables,
        'region': region,
        'restricciones': segmentos_restriccion,
        'objetivo_segmento': segmento_objetivo
    }
    return resultado
