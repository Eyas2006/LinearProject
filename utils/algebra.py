import sympy as sp
import numpy as np

class MatrixAlgebra:
    @staticmethod
    def ref(matrix):
        try:
            M = sp.Matrix(matrix)
            echelon_form, pivots = M.rref()
            result = []
            for i in range(echelon_form.rows):
                row = []
                for j in range(echelon_form.cols):
                    element = echelon_form[i, j]
                    if hasattr(element, 'evalf'):
                        row.append(float(element.evalf()))
                    else:
                        row.append(float(element))
                result.append(row)
            return result
        except Exception as e:
            raise Exception(f"REF computation failed: {str(e)}")

    @staticmethod
    def rref(matrix):
        try:
            M = sp.Matrix(matrix)
            rref_matrix, pivots = M.rref()
            result = []
            for i in range(rref_matrix.rows):
                row = []
                for j in range(rref_matrix.cols):
                    element = rref_matrix[i, j]
                    if hasattr(element, 'evalf'):
                        row.append(float(element.evalf()))
                    else:
                        row.append(float(element))
                result.append(row)
            return result
        except Exception as e:
            raise Exception(f"RREF computation failed: {str(e)}")

    @staticmethod
    def matrix_algebra(matrix1, operator, matrix2):
        try:
            a = np.array(matrix1, dtype=float)
            b = np.array(matrix2, dtype=float)
            if operator == "+":
                if a.shape != b.shape:
                    raise ValueError("Matrix dimensions must match for addition")
                return a + b
            elif operator == "-":
                if a.shape != b.shape:
                    raise ValueError("Matrix dimensions must match for subtraction")
                return a - b
            elif operator == "*":
                if a.shape[1] != b.shape[0]:
                    raise ValueError("Inner dimensions must match for multiplication")
                return a @ b
            else:
                raise ValueError(f"Unsupported operator: {operator}")
        except Exception as e:
            raise Exception(f"Matrix operation failed: {str(e)}")

    @staticmethod
    def matrix_scaler_algebra(matrix, num):
        try:
            return np.array(matrix, dtype=float) * float(num)
        except Exception as e:
            raise Exception(f"Scalar multiplication failed: {str(e)}")

    @staticmethod
    def det(matrix):
        try:
            matrix_np = np.array(matrix, dtype=float)
            if matrix_np.shape[0] != matrix_np.shape[1]:
                raise ValueError("Matrix must be square for determinant computation")
            return float(np.linalg.det(matrix_np))
        except Exception as e:
            raise Exception(f"Determinant computation failed: {str(e)}")

    @staticmethod
    def cramer(matrix, result):
        try:
            A = np.array(matrix, dtype=float)
            b = np.array(result, dtype=float)
            if A.shape[0] != A.shape[1]:
                raise ValueError("Coefficient matrix must be square")
            if len(b.shape) > 1:
                b = b.flatten()
            det_A = np.linalg.det(A)
            if abs(det_A) < 1e-10:
                return "System is singular - no unique solution exists"
            solutions = []
            for i in range(A.shape[1]):
                Ai = A.copy()
                Ai[:, i] = b
                solutions.append(np.linalg.det(Ai) / det_A)
            return np.array(solutions)
        except Exception as e:
            raise Exception(f"Cramer's rule failed: {str(e)}")

    @staticmethod
    def linear_independent(matrix):
        try:
            M = sp.Matrix(matrix)
            rank = M.rank()
            return rank == M.shape[0]
        except Exception as e:
            raise Exception(f"Linear independence check failed: {str(e)}")

    @staticmethod
    def basis_dimension(matrix):
        try:
            M = sp.Matrix(matrix)
            rank = M.rank()
            independent = (rank == M.shape[0])
            rref_matrix, pivots = M.rref()
            column_space_basis = []
            for col_idx in pivots:
                col_vector = []
                for i in range(M.rows):
                    col_vector.append(float(M[i, col_idx]))
                column_space_basis.append(col_vector)
            row_space_basis = []
            for i in range(rref_matrix.rows):
                row = [float(x) for x in rref_matrix.row(i)]
                if any(abs(x) > 1e-10 for x in row):
                    row_space_basis.append(row)
            span_basis = column_space_basis.copy()
            return rank, independent, column_space_basis, row_space_basis, span_basis
        except Exception as e:
            raise Exception(f"Basis analysis failed: {str(e)}")

    @staticmethod
    def row_space(matrix):
        try:
            M = sp.Matrix(matrix)
            rref_matrix, pivots = M.rref()
            row_space_basis = []
            for i in range(rref_matrix.rows):
                row = [float(x) for x in rref_matrix.row(i)]
                if any(abs(x) > 1e-10 for x in row):
                    row_space_basis.append(row)
            return row_space_basis
        except Exception as e:
            raise Exception(f"Row space computation failed: {str(e)}")

    @staticmethod
    def col_space(matrix):
        try:
            M = sp.Matrix(matrix)
            rref_matrix, pivots = M.rref()
            column_space_basis = []
            for col_idx in pivots:
                col_vector = []
                for i in range(M.rows):
                    col_vector.append(float(M[i, col_idx]))
                column_space_basis.append(col_vector)
            return column_space_basis
        except Exception as e:
            raise Exception(f"Column space computation failed: {str(e)}")

    @staticmethod
    def eig(matrix):
        try:
            A = np.array(matrix, dtype=float)
            if A.shape[0] != A.shape[1]:
                raise ValueError("Matrix must be square for eigenvalue analysis")
            eigenvalues, eigenvectors = np.linalg.eig(A)
            eigenvalues_list = []
            for val in eigenvalues:
                if abs(val.imag) < 1e-10:
                    eigenvalues_list.append(float(val.real))
                else:
                    eigenvalues_list.append(complex(val))
            eigenvectors_list = []
            for i in range(eigenvectors.shape[1]):
                eigenvector = []
                for j in range(eigenvectors.shape[0]):
                    val = eigenvectors[j, i]
                    if abs(val.imag) < 1e-10:
                        eigenvector.append(float(val.real))
                    else:
                        eigenvector.append(complex(val))
                eigenvectors_list.append(eigenvector)
            return {
                "eigenvalues": eigenvalues_list,
                "eigenvectors": eigenvectors_list
            }
        except Exception as e:
            raise Exception(f"Eigen analysis failed: {str(e)}")

    @staticmethod
    def diagonalize(matrix):
        try:
            M = sp.Matrix(matrix)
            if M.is_diagonalizable():
                P, D = M.diagonalize()
                P_inv = P.inv()
                P_list = []
                for i in range(P.rows):
                    row = []
                    for j in range(P.cols):
                        val = P[i, j]
                        if hasattr(val, 'evalf'):
                            row.append(float(val.evalf()))
                        else:
                            row.append(float(val))
                    P_list.append(row)
                D_list = []
                for i in range(D.rows):
                    row = []
                    for j in range(D.cols):
                        val = D[i, j]
                        if hasattr(val, 'evalf'):
                            row.append(float(val.evalf()))
                        else:
                            row.append(float(val))
                    D_list.append(row)
                P_inv_list = []
                for i in range(P_inv.rows):
                    row = []
                    for j in range(P_inv.cols):
                        val = P_inv[i, j]
                        if hasattr(val, 'evalf'):
                            row.append(float(val.evalf()))
                        else:
                            row.append(float(val))
                    P_inv_list.append(row)
                return {
                    "P": P_list,
                    "D": D_list,
                    "P_inv": P_inv_list,
                    "message": "Matrix is diagonalizable"
                }
            else:
                return "Matrix is not diagonalizable"
        except Exception as e:
            raise Exception(f"Diagonalization failed: {str(e)}")

    @staticmethod
    def inverse(matrix):
        try:
            M = sp.Matrix(matrix)
            if M.shape[0] != M.shape[1]:
                raise ValueError("Matrix must be square for inversion")
            if M.det() == 0:
                return "Matrix is singular - no inverse exists"
            inv_matrix = M.inv()
            result = []
            for i in range(inv_matrix.rows):
                row = []
                for j in range(inv_matrix.cols):
                    val = inv_matrix[i, j]
                    if hasattr(val, 'evalf'):
                        row.append(float(val.evalf()))
                    else:
                        row.append(float(val))
                result.append(row)
            return result
        except Exception as e:
            raise Exception(f"Inversion failed: {str(e)}")

    @staticmethod
    def transpose(matrix):
        try:
            M = sp.Matrix(matrix)
            transpose_matrix = M.T
            result = []
            for i in range(transpose_matrix.rows):
                row = []
                for j in range(transpose_matrix.cols):
                    val = transpose_matrix[i, j]
                    if hasattr(val, 'evalf'):
                        row.append(float(val.evalf()))
                    else:
                        row.append(float(val))
                result.append(row)
            return result
        except Exception as e:
            raise Exception(f"Transpose failed: {str(e)}")

    @staticmethod
    def trace(matrix):
        try:
            M = sp.Matrix(matrix)
            if M.shape[0] != M.shape[1]:
                raise ValueError("Matrix must be square for trace computation")
            return float(M.trace())
        except Exception as e:
            raise Exception(f"Trace computation failed: {str(e)}")

    @staticmethod
    def rank(matrix):
        try:
            M = sp.Matrix(matrix)
            return int(M.rank())
        except Exception as e:
            raise Exception(f"Rank computation failed: {str(e)}")

    @staticmethod
    def nullity(matrix):
        try:
            M = sp.Matrix(matrix)
            rank = M.rank()
            return M.shape[1] - rank
        except Exception as e:
            raise Exception(f"Nullity computation failed: {str(e)}")
