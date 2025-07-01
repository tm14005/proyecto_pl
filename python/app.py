import json
from flask import Flask, request, jsonify
from sympy import symbols, Eq, solve
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
from itertools import combinations
import numpy as np

app = Flask(__name__)

# Usar el parser de sympy con multiplicación implícita
transformations = (standard_transformations + (implicit_multiplication_application,))

def parse_expr_custom(expr_str):
    x, y = symbols('x y')
    return parse_expr(expr_str, local_dict={'x': x, 'y': y}, transformations=transformations)

def parse_ineq(ineq_str):
    ops = ['<=', '>=', '<', '>']
    for op in ops:
        if op in ineq_str:
            lhs, rhs = ineq_str.split(op)
            return parse_expr_custom(lhs), op, parse_expr_custom(rhs)
    raise ValueError(f"Operador no soportado en {ineq_str}")

def ineq_to_eq(ineq):
    lhs, op, rhs = ineq
    return Eq(lhs, rhs)

def is_feasible(point, restricciones):
    x, y = symbols('x y')
    px, py = point
    for restr in restricciones:
        lhs, op, rhs = restr
        val = lhs.subs({'x': px, 'y': py})
        val_rhs = rhs.subs({'x': px, 'y': py})
        if op == '<=' and not (val <= val_rhs + 1e-9): return False
        if op == '>=' and not (val >= val_rhs - 1e-9): return False
        if op == '<'  and not (val <  val_rhs): return False
        if op == '>'  and not (val >  val_rhs): return False
    return True

def get_line_points(ineq, xlim, ylim):
    x, y = symbols('x y')
    lhs, op, rhs = ineq
    try:
        eq = Eq(lhs, rhs)
        ysol = solve(eq, y)
        if ysol:
            x1, x2 = xlim
            y1 = ysol[0].subs(x, x1)
            y2 = ysol[0].subs(x, x2)
            return [(float(x1), float(y1)), (float(x2), float(y2))]
        else:
            xsol = solve(eq, x)
            if xsol:
                xval = float(xsol[0])
                return [(xval, float(ylim[0])), (xval, float(ylim[1]))]
    except Exception:
        pass
    return [(0,0), (0,0)]

def ordenar_vertices(puntos):
    puntos_np = np.array(puntos)
    centro = np.mean(puntos_np, axis=0)
    angles = np.arctan2(puntos_np[:,1] - centro[1], puntos_np[:,0] - centro[0])
    orden = np.argsort(angles)
    return [tuple(puntos_np[i]) for i in orden]

@app.route('/resolver-lp', methods=['POST'])
def resolver_lp():
    data = request.json
    tipo = data['tipo']
    objetivo = data['objetivo']
    restricciones_str = data['restricciones']

    x, y = symbols('x y')
    restricciones = [parse_ineq(r) for r in restricciones_str]

    vertices = set()
    for r1, r2 in combinations(restricciones, 2):
        try:
            eq1 = ineq_to_eq(r1)
            eq2 = ineq_to_eq(r2)
            sol = solve([eq1, eq2], (x, y), dict=True)
            if sol:
                px = float(sol[0][x])
                py = float(sol[0][y])
                p = (round(px, 8), round(py, 8))
                if is_feasible(p, restricciones):
                    vertices.add(p)
        except Exception:
            continue

    for restr in restricciones:
        for val, var in [(0, x), (0, y)]:
            try:
                eq = ineq_to_eq(restr)
                sol = solve([eq, Eq(var, val)], (x, y), dict=True)
                if sol:
                    px = float(sol[0][x])
                    py = float(sol[0][y])
                    p = (round(px, 8), round(py, 8))
                    if is_feasible(p, restricciones):
                        vertices.add(p)
            except Exception:
                continue

    vertices = [p for p in vertices if p[0] >= -1e-7 and p[1] >= -1e-7]
    if not vertices:
        return jsonify({"estado": "Sin solución o región factible vacía."})

    vertices = ordenar_vertices(vertices)
    obj_expr = parse_expr_custom(objetivo)
    valores = []
    for vx, vy in vertices:
        val = obj_expr.subs({'x': vx, 'y': vy})
        valores.append(float(val))

    if tipo == "max":
        idx = valores.index(max(valores))
    else:
        idx = valores.index(min(valores))

    optimo = {"x": vertices[idx][0], "y": vertices[idx][1], "z": valores[idx]}
    xs = [p[0] for p in vertices]
    ys = [p[1] for p in vertices]
    xlim = (min(xs + [0]), max(xs + [0]) + 1)
    ylim = (min(ys + [0]), max(ys + [0]) + 1)

    restricciones_graf = []
    for restr, restr_str in zip(restricciones, restricciones_str):
        p1, p2 = get_line_points(restr, xlim, ylim)
        restricciones_graf.append({
            "expr": restr_str,
            "p1": list(p1),
            "p2": list(p2)
        })

    obj_eq = Eq(obj_expr, optimo["z"])
    try:
        ysol = solve(obj_eq, y)
        if ysol:
            yfun = ysol[0]
            x1, x2 = xlim
            y1 = yfun.subs(x, x1)
            y2 = yfun.subs(x, x2)
            objetivo_graf = {
                "expr": objetivo,
                "nivel": optimo["z"],
                "p1": [float(x1), float(y1)],
                "p2": [float(x2), float(y2)]
            }
        else:
            objetivo_graf = None
    except Exception:
        objetivo_graf = None

    resp = {
        "estado": "Óptimo",
        "restricciones": restricciones_graf,
        "factible": [list(p) for p in vertices],
        "vertices": [list(p) for p in vertices],
        "optimo": optimo,
        "objetivo": objetivo_graf
    }
    return jsonify(resp)

if __name__ == "__main__":
    app.run(debug=True)
