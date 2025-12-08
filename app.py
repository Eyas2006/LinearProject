from flask import Flask, render_template, request, jsonify
from utils.algebra import MatrixAlgebra
from scipy.integrate import solve_ivp
import re
import numpy as np
import json
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "matrix_lab_pro_secure_key_2025")

MATRICES_FILE = 'data/matrices.json'
HISTORY_FILE = 'data/computation_history.json'
os.makedirs('data', exist_ok=True)

class MatrixManager:
    @staticmethod
    def load_matrices():
        try:
            if os.path.exists(MATRICES_FILE):
                with open(MATRICES_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except:
            return []

    @staticmethod
    def save_matrices(matrices):
        try:
            with open(MATRICES_FILE, 'w', encoding='utf-8') as f:
                json.dump(matrices, f, indent=2)
            return True
        except:
            return False

class HistoryManager:
    @staticmethod
    def load_history():
        try:
            if os.path.exists(HISTORY_FILE):
                with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except:
            return []

    @staticmethod
    def save_history(history):
        try:
            with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
                json.dump(history[-50:], f, indent=2)
            return True
        except:
            return False

    @staticmethod
    def add_entry(operation, matrix_name, result):
        history = HistoryManager.load_history()
        entry = {
            'timestamp': np.datetime64('now').astype(str),
            'operation': operation,
            'matrix': matrix_name,
            'result_preview': str(result)[:100] + '...' if len(str(result)) > 100 else str(result)
        }
        history.append(entry)
        HistoryManager.save_history(history)

@app.route("/", methods=["GET", "POST"])
def index():
    try:
        rows = min(max(int(request.form.get("mRows", 3)), 1), 10)
        cols = min(max(int(request.form.get("mCols", 3)), 1), 10)
    except:
        rows, cols = 3, 3

    matrix = [[0.0 for _ in range(cols)] for _ in range(rows)]
    computation_result = None

    if request.method == "POST":
        action = request.form.get("action")

        if action == "save_matrix":
            matrix = []
            for r in range(rows):
                row = []
                for c in range(cols):
                    cell_value = request.form.get(f"cell_{r}_{c}", "0").strip()
                    try:
                        row.append(float(cell_value))
                    except:
                        row.append(0.0)
                matrix.append(row)

            name = request.form.get("mName", "").strip() or f"M{len(MatrixManager.load_matrices()) + 1}"
            matrices = MatrixManager.load_matrices()
            matrices.append({"name": name, "matrix": matrix})
            MatrixManager.save_matrices(matrices)

        elif action == "operation":
            operation = request.form.get("op")
            matrix_data = request.form.get("selected_matrix")

            try:
                matrix = json.loads(matrix_data)
            except:
                matrix = [[0.0 for _ in range(cols)] for _ in range(rows)]

            try:
                operation_handlers = {
                    "rref": MatrixAlgebra.rref,
                    "ref": MatrixAlgebra.ref,
                    "det": MatrixAlgebra.det,
                    "linear_independent": MatrixAlgebra.linear_independent,
                    "basis_dimension": lambda m: format_basis_result(MatrixAlgebra.basis_dimension(m)),
                    "row_space": MatrixAlgebra.row_space,
                    "col_space": MatrixAlgebra.col_space,
                    "eig": MatrixAlgebra.eig,
                    "diagonalize": MatrixAlgebra.diagonalize,
                    "inverse": MatrixAlgebra.inverse,
                    "transpose": MatrixAlgebra.transpose,
                    "trace": MatrixAlgebra.trace,
                    "rank": MatrixAlgebra.rank,
                    "nullity": MatrixAlgebra.nullity
                }

                handler = operation_handlers.get(operation)
                if handler:
                    computation_result = handler(matrix)
                else:
                    computation_result = f"Unsupported operation: {operation}"

            except Exception as e:
                computation_result = f"Computation error: {str(e)}"

    return render_template(
        "index.html",
        rows=rows,
        cols=cols,
        matrix=matrix,
        matrices=MatrixManager.load_matrices(),
        result=computation_result,
        history=HistoryManager.load_history()[-5:]
    )

def format_basis_result(basis_data):
    rank, independent, col_basis, row_basis, span_basis = basis_data
    return {
        "rank": rank,
        "independent": independent,
        "column_basis": [[float(x) for x in v] for v in col_basis],
        "row_basis": row_basis,
        "span_basis": [[float(x) for x in v] for v in span_basis]
    }

@app.route("/api/single_matrix_operation", methods=["POST"])
def single_matrix_operation():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No data provided"})

    matrix = data.get("matrix")
    operation = data.get("operation")
    matrix_name = data.get("matrix_name", "Unknown")

    if not matrix or not operation:
        return jsonify({"success": False, "error": "Matrix and operation required"})

    try:
        operation_handlers = {
            "rref": MatrixAlgebra.rref,
            "ref": MatrixAlgebra.ref,
            "det": MatrixAlgebra.det,
            "linear_independent": MatrixAlgebra.linear_independent,
            "basis_dimension": lambda m: format_basis_result(MatrixAlgebra.basis_dimension(m)),
            "row_space": MatrixAlgebra.row_space,
            "col_space": MatrixAlgebra.col_space,
            "eig": MatrixAlgebra.eig,
            "diagonalize": MatrixAlgebra.diagonalize,
            "inverse": MatrixAlgebra.inverse,
            "transpose": MatrixAlgebra.transpose,
            "trace": MatrixAlgebra.trace,
            "rank": MatrixAlgebra.rank,
            "nullity": MatrixAlgebra.nullity
        }

        handler = operation_handlers.get(operation)
        if not handler:
            return jsonify({"success": False, "error": f"Unsupported operation: {operation}"})

        result = handler(matrix)

        if operation == "linear_independent":
            result = "Linearly Independent" if result else "Linearly Dependent"
        elif operation == "basis_dimension" and isinstance(result, dict):
            result = {
                "rank": int(result["rank"]),
                "independent": bool(result["independent"]),
                "column_basis": result["column_basis"],
                "row_basis": result["row_basis"],
                "span_basis": result["span_basis"]
            }

        HistoryManager.add_entry(operation, matrix_name, result)
        return jsonify({"success": True, "result": result})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/api/matrix_operation", methods=["POST"])
def matrix_operation():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No data provided"})

    try:
        operation = data.get("operation")

        if operation == "algebra":
            matrix1 = data.get("matrix1")
            matrix2 = data.get("matrix2")
            operator = data.get("operator")

            if not all([matrix1, matrix2, operator]):
                return jsonify({"success": False, "error": "Missing required parameters"})

            result = MatrixAlgebra.matrix_algebra(matrix1, operator, matrix2)
            HistoryManager.add_entry(f"Algebra ({operator})", "Multiple", result)
            return jsonify({"success": True, "result": result.tolist()})

        elif operation == "scalar":
            matrix1 = data.get("matrix1")
            scalar = data.get("scalar")

            if matrix1 is None or scalar is None:
                return jsonify({"success": False, "error": "Matrix and scalar required"})

            result = MatrixAlgebra.matrix_scaler_algebra(matrix1, scalar)
            HistoryManager.add_entry("Scalar Multiplication", "Multiple", result)
            return jsonify({"success": True, "result": result.tolist()})

        elif operation == "cramer":
            matrix1 = data.get("matrix1")
            matrix2 = data.get("matrix2")

            if not all([matrix1, matrix2]):
                return jsonify({"success": False, "error": "Coefficient matrix and constant vector required"})

            result = MatrixAlgebra.cramer(matrix1, matrix2)
            HistoryManager.add_entry("Cramer's Rule", "System", result)
            if isinstance(result, str):
                return jsonify({"success": True, "result": result})
            else:
                return jsonify({"success": True, "result": result.tolist()})

        else:
            return jsonify({"success": False, "error": f"Unknown operation: {operation}"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/api/save_matrix", methods=["POST"])
def save_matrix_api():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No data provided"})

    name = data.get("name", "").strip()
    matrix = data.get("matrix")

    if not name or not matrix:
        return jsonify({"success": False, "error": "Matrix name and data required"})

    try:
        matrices = MatrixManager.load_matrices()
        matrices.append({"name": name, "matrix": matrix})

        if MatrixManager.save_matrices(matrices):
            return jsonify({"success": True, "matrices": matrices})
        else:
            return jsonify({"success": False, "error": "Failed to save matrix"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/api/get_matrices", methods=["GET"])
def get_matrices_api():
    return jsonify(MatrixManager.load_matrices())

@app.route("/api/get_history", methods=["GET"])
def get_history_api():
    return jsonify(HistoryManager.load_history()[-10:])

@app.route("/api/clear_history", methods=["POST"])
def clear_history():
    try:
        HistoryManager.save_history([])
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/api/delete_matrix", methods=["POST"])
def delete_matrix():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No data provided"})

    matrix_name = data.get("name")

    if not matrix_name:
        return jsonify({"success": False, "error": "Matrix name required"})

    try:
        matrices = MatrixManager.load_matrices()
        matrices = [m for m in matrices if m["name"] != matrix_name]

        if MatrixManager.save_matrices(matrices):
            return jsonify({"success": True, "matrices": matrices})
        else:
            return jsonify({"success": False, "error": "Failed to delete matrix"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/api/update_matrix", methods=["POST"])
def update_matrix():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No data provided"})

    old_name = data.get("old_name")
    new_name = data.get("new_name", "").strip()
    matrix = data.get("matrix")

    if not all([old_name, new_name, matrix]):
        return jsonify({"success": False, "error": "All parameters required"})

    try:
        matrices = MatrixManager.load_matrices()
        updated = False

        for m in matrices:
            if m["name"] == old_name:
                m["name"] = new_name
                m["matrix"] = matrix
                updated = True
                break

        if updated and MatrixManager.save_matrices(matrices):
            return jsonify({"success": True, "matrices": matrices})
        else:
            return jsonify({"success": False, "error": "Matrix not found or failed to update"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/api/quick_actions", methods=["POST"])
def quick_actions():
    data = request.get_json()
    action = data.get("action")
    rows = data.get("rows", 3)
    cols = data.get("cols", 3)
    size = data.get("size", 3)

    try:
        if action == "identity":
            matrix = [[1 if i == j else 0 for j in range(size)] for i in range(size)]
            return jsonify({"success": True, "matrix": matrix})
        elif action == "zeros":
            matrix = [[0 for _ in range(cols)] for _ in range(rows)]
            return jsonify({"success": True, "matrix": matrix})
        elif action == "ones":
            matrix = [[1 for _ in range(cols)] for _ in range(rows)]
            return jsonify({"success": True, "matrix": matrix})
        elif action == "random":
            matrix = [[round(np.random.uniform(-10, 10), 2) for _ in range(cols)] for _ in range(rows)]
            return jsonify({"success": True, "matrix": matrix})
        elif action == "hilbert":
            n = min(rows, cols)
            matrix = [[1/(i+j+1) for j in range(cols)] for i in range(rows)]
            return jsonify({"success": True, "matrix": matrix})
        elif action == "vandermonde":
            x = [i for i in range(cols)]
            matrix = [[x[j]**i for j in range(cols)] for i in range(rows)]
            return jsonify({"success": True, "matrix": matrix})
        else:
            return jsonify({"success": False, "error": "Unknown quick action"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "MatrixLab Pro"})

@app.route("/differential-equations")
def differential_equations():
    return render_template("differential_equations.html")

@app.route("/about")
def about():
    return render_template("about.html")


def solve_ode_numerically(equation, conditions, ode_type, start, end, step):
    try:
        if ode_type == "first_order":
            return solve_first_order_ode(equation, conditions, start, end, step)
        elif ode_type == "second_order":
            return solve_second_order_ode(equation, conditions, start, end, step)
        else:
            raise ValueError(f"Unsupported ODE type: {ode_type}")
    except Exception as e:
        raise Exception(f"ODE solving failed: {str(e)}")


def solve_first_order_ode(equation, conditions, start, end, step):
    try:
        equation = equation.replace(' ', '')

        if 'dy/dx=' in equation:
            expr = equation.split('dy/dx=')[1]
        elif "y'=" in equation:
            expr = equation.split("y'=")[1]
        else:
            raise ValueError("Invalid first order ODE format. Use: dy/dx = ... or y' = ...")

        conditions = conditions.replace(' ', '')
        ic_match = re.match(r"y\(([^)]+)\)=([^,]+)", conditions)
        if not ic_match:
            raise ValueError("Invalid initial condition format. Use: y(x0)=y0")

        x0 = float(ic_match.group(1))
        y0 = float(ic_match.group(2))

        def ode_func(x, y):
            local_expr = expr.replace('y', f'({y[0]})').replace('x', f'({x})')
            try:
                result = eval(local_expr, {"__builtins__": {}}, {})
                return [result]
            except Exception as eval_error:
                raise ValueError(f"Could not evaluate expression: {local_expr}. Error: {str(eval_error)}")

        t_eval = np.arange(start, end + step, step)
        solution = solve_ivp(ode_func, [start, end], [y0], t_eval=t_eval, method='RK45')

        results = {
            "type": "first_order",
            "solution": {
                "x": solution.t.tolist(),
                "y": solution.y[0].tolist()
            },
            "initial_condition": f"y({x0}) = {y0}",
            "equation": equation,
            "range_start": start,
            "range_end": end,
            "step_size": step
        }

        return results

    except Exception as e:
        raise Exception(f"First order ODE solving error: {str(e)}")


def solve_second_order_ode(equation, conditions, start, end, step):
    try:
        equation = equation.replace(' ', '')
        if "d²y/dx²+4y=0" in equation or "y''+4y=0" in equation:
            conditions = conditions.replace(' ', '')
            y_match = re.search(r"y\(([^)]+)\)=([^,]+)", conditions)
            dy_match = re.search(r"y'\(([^)]+)\)=([^,]+)", conditions)

            y0 = float(y_match.group(2)) if y_match else 0.0
            dy0 = float(dy_match.group(2)) if dy_match else 1.0

            def ode_func(t, yz):
                y, z = yz
                return [z, -4 * y]

            t_eval = np.arange(start, end + step, step)
            solution = solve_ivp(ode_func, [start, end], [y0, dy0], t_eval=t_eval, method='RK45')

            results = {
                "type": "second_order",
                "solution": {
                    "x": solution.t.tolist(),
                    "y": solution.y[0].tolist(),
                    "dy": solution.y[1].tolist()
                },
                "initial_conditions": conditions,
                "equation": equation,
                "range_start": start,
                "range_end": end,
                "step_size": step
            }
            return results
        else:
            raise ValueError("This second order ODE solver currently supports: y'' + 4y = 0")

    except Exception as e:
        raise Exception(f"Second order ODE solving error: {str(e)}")


@app.route("/api/solve_ode", methods=["POST"])
def solve_ode():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No data provided"})

    try:
        equation = data.get("equation", "").strip()
        conditions = data.get("conditions", "").strip()
        ode_type = data.get("type", "first_order")
        range_start = float(data.get("range_start", 0))
        range_end = float(data.get("range_end", 10))
        step_size = float(data.get("step_size", 0.1))

        if not equation or not conditions:
            return jsonify({"success": False, "error": "Equation and initial conditions are required"})

        if range_start >= range_end:
            return jsonify({"success": False, "error": "End value must be greater than start value"})

        result = solve_ode_numerically(equation, conditions, ode_type, range_start, range_end, step_size)

        HistoryManager.add_entry("ODE Solution", equation[:50] + "...", f"Range: [{range_start}, {range_end}]")
        return jsonify({"success": True, "result": result})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=5000)

