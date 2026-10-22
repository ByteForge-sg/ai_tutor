import json
import sqlite3
import datetime
import random
from app.database import get_db_connection, init_db

QUESTIONS_DATA = [
    # ==================== JEE PHYSICS (7 questions) ====================
    {
        "id": "jee-phy-001",
        "exam": "JEE",
        "subject": "Physics",
        "chapter": "Mechanics",
        "topic": "Rotational Motion",
        "difficulty": "Medium",
        "question_text": "A solid uniform sphere and a thin hollow cylinder of the same mass M and radius R roll without slipping down an inclined plane of inclination θ from the same height. What is the ratio of their translational kinetic energies when they reach the bottom?",
        "options_json": json.dumps([
            "A) 1 : 1",
            "B) 7 : 5",
            "C) 5 : 7",
            "D) 10 : 7"
        ]),
        "correct_answer": "D",
        "explanation": "Total energy E = Mgh is converted into translational KE (1/2 M v^2) and rotational KE (1/2 I ω^2). Since v = Rω, Total KE = 1/2 M v^2 (1 + k^2/R^2) = Mgh. Translational KE = Mgh / (1 + k^2/R^2). For solid sphere: k^2/R^2 = 2/5, so K_trans(sphere) = Mgh / (1 + 2/5) = 5/7 Mgh. For hollow cylinder: k^2/R^2 = 1, so K_trans(cylinder) = Mgh / (1 + 1) = 1/2 Mgh. Ratio = (5/7) / (1/2) = 10 / 7.",
        "concept": "Rolling Without Slipping & Energy Partition Theorem",
        "common_mistake": "Assuming all rolling bodies have equal translational KE because initial potential energy Mgh is the same, or confusing I_cylinder = MR^2 with solid cylinder 1/2 MR^2.",
        "mistake_categories_json": json.dumps(["FORMULA_RECALL", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "jee-phy-002",
        "exam": "JEE",
        "subject": "Physics",
        "chapter": "Mechanics",
        "topic": "Rotational Motion",
        "difficulty": "Hard",
        "question_text": "A thin uniform rod of mass M and length L is hinged smoothly at one end and held horizontally. It is released from rest. What is the angular acceleration of the rod immediately after release?",
        "options_json": json.dumps([
            "A) 3g / (2L)",
            "B) 2g / (3L)",
            "C) g / L",
            "D) 6g / L"
        ]),
        "correct_answer": "A",
        "explanation": "Torque about the hinge = Mg * (L/2). Moment of inertia about the end hinge = 1/3 M L^2. Using τ = I α: Mg(L/2) = (1/3 M L^2) α => α = [Mg(L/2)] / [1/3 M L^2] = 3g / (2L).",
        "concept": "Torque and Moment of Inertia for Hinged Rigid Bodies",
        "common_mistake": "Using the moment of inertia about center of mass (1/12 M L^2) instead of the hinge at the end (1/3 M L^2), yielding 6g/L.",
        "mistake_categories_json": json.dumps(["FORMULA_RECALL", "WRONG_APPROACH"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "jee-phy-003",
        "exam": "JEE",
        "subject": "Physics",
        "chapter": "Mechanics",
        "topic": "Kinematics",
        "difficulty": "Easy",
        "question_text": "A projectile is fired from the ground with an initial speed u at an angle θ with the horizontal. What is the radius of curvature of its trajectory at the highest point?",
        "options_json": json.dumps([
            "A) (u^2 cos^2 θ) / g",
            "B) (u^2 sin^2 θ) / g",
            "C) u^2 / g",
            "D) (2u^2 cos θ) / g"
        ]),
        "correct_answer": "A",
        "explanation": "At the peak of trajectory, the velocity is entirely horizontal, v = u cos θ. The acceleration perpendicular to the trajectory is normal acceleration a_n = g. The radius of curvature R = v^2 / a_n = (u cos θ)^2 / g = (u^2 cos^2 θ) / g.",
        "concept": "Curvature of 2D Trajectories and Normal Acceleration",
        "common_mistake": "Using total speed u instead of peak horizontal speed u cos θ, or taking tangential acceleration instead of normal acceleration.",
        "mistake_categories_json": json.dumps(["FORMULA_RECALL", "CARELESS_MISTAKE"]),
        "source_type": "PYQ",
        "year": 2022
    },
    {
        "id": "jee-phy-004",
        "exam": "JEE",
        "subject": "Physics",
        "chapter": "Electrodynamics",
        "topic": "Current Electricity",
        "difficulty": "Medium",
        "question_text": "In a potentiometer wire of length 100 cm and resistance 10 Ω, a steady current is set up by a 2V accumulator of negligible internal resistance. An unknown emf ε is balanced across a length of 75 cm. What is the value of ε?",
        "options_json": json.dumps([
            "A) 1.5 V",
            "B) 1.2 V",
            "C) 0.75 V",
            "D) 1.8 V"
        ]),
        "correct_answer": "A",
        "explanation": "Potential gradient k = V / L = 2V / 100 cm = 0.02 V/cm. The balance length l = 75 cm. Thus ε = k * l = 0.02 * 75 = 1.5 V.",
        "concept": "Potentiometer Principle and Potential Gradient",
        "common_mistake": "Multiplying the wire resistance directly without finding potential gradient per unit length.",
        "mistake_categories_json": json.dumps(["CALCULATION_ERROR", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "NCERT",
        "year": 2023
    },
    {
        "id": "jee-phy-005",
        "exam": "JEE",
        "subject": "Physics",
        "chapter": "Electrodynamics",
        "topic": "Electrostatics",
        "difficulty": "Medium",
        "question_text": "Two spherical conductors of radii R1 and R2 are separated by a large distance and charged to potentials V1 and V2 respectively. When connected by a thin conducting wire, what is the common final potential V?",
        "options_json": json.dumps([
            "A) (R1 V1 + R2 V2) / (R1 + R2)",
            "B) (V1 + V2) / 2",
            "C) (R1^2 V1 + R2^2 V2) / (R1^2 + R2^2)",
            "D) (R1 V2 + R2 V1) / (R1 + R2)"
        ]),
        "correct_answer": "A",
        "explanation": "Capacitances are C1 = 4πε0 R1 and C2 = 4πε0 R2. Total initial charge Q = C1 V1 + C2 V2. Common potential V = Total charge / Total capacitance = (C1 V1 + C2 V2) / (C1 + C2) = (R1 V1 + R2 V2) / (R1 + R2).",
        "concept": "Charge Redistribution and Electrostatic Potential of Spheres",
        "common_mistake": "Taking the arithmetic mean of potentials (V1 + V2)/2 without weighting by individual capacitances.",
        "mistake_categories_json": json.dumps(["WRONG_APPROACH", "CARELESS_MISTAKE"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "jee-phy-006",
        "exam": "JEE",
        "subject": "Physics",
        "chapter": "Modern Physics",
        "topic": "Photoelectric Effect",
        "difficulty": "Hard",
        "question_text": "When light of frequency 2ν0 (where ν0 is threshold frequency) is incident on a metal plate, maximum velocity of emitted electrons is v1. When frequency is increased to 5ν0, maximum velocity is v2. What is the ratio v1 / v2?",
        "options_json": json.dumps([
            "A) 1 : 2",
            "B) 1 : 4",
            "C) 2 : 5",
            "D) 1 : √2"
        ]),
        "correct_answer": "A",
        "explanation": "Einstein's photoelectric equation: KE_max = 1/2 m v^2 = hν - hν0. For ν = 2ν0: 1/2 m v1^2 = 2hν0 - hν0 = hν0. For ν = 5ν0: 1/2 m v2^2 = 5hν0 - hν0 = 4hν0. Taking ratio: (v1 / v2)^2 = 1 / 4 => v1 / v2 = 1 / 2.",
        "concept": "Einstein's Photoelectric Equation and Kinetic Energy",
        "common_mistake": "Equating velocity ratio directly to frequency ratio (2 : 5) or forgetting that kinetic energy is proportional to v^2, not v.",
        "mistake_categories_json": json.dumps(["FORMULA_RECALL", "CALCULATION_ERROR"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "jee-phy-007",
        "exam": "JEE",
        "subject": "Physics",
        "chapter": "Mechanics",
        "topic": "Work-Energy-Power",
        "difficulty": "Easy",
        "question_text": "A particle of mass m moves in a circular path of radius r under the action of an attractive central force F = -k / r. What is the total mechanical energy of the particle (taking potential energy U = 0 at r = r0)?",
        "options_json": json.dumps([
            "A) k/2 ln(r/r0) + constant",
            "B) Zero",
            "C) - k / (2r)",
            "D) k / (2r)"
        ]),
        "correct_answer": "A",
        "explanation": "Force F = k/r provides centripetal acceleration: m v^2 / r = k/r => mv^2 = k => KE = 1/2 k. Potential energy U = - ∫ F dr = ∫ (k/r) dr = k ln(r/r0). Total Energy E = KE + U = k/2 + k ln(r/r0).",
        "concept": "Central Force Motion and Logarithmic Potential Integrals",
        "common_mistake": "Assuming inverse square law 1/r^2 and applying standard virial theorem E = -k/(2r).",
        "mistake_categories_json": json.dumps(["MISREAD_QUESTION", "WRONG_APPROACH"]),
        "source_type": "CURATED",
        "year": 2024
    },

    # ==================== JEE CHEMISTRY (7 questions) ====================
    {
        "id": "jee-chem-001",
        "exam": "JEE",
        "subject": "Chemistry",
        "chapter": "Physical Chemistry",
        "topic": "Chemical Kinetics",
        "difficulty": "Medium",
        "question_text": "For a first order reaction A -> Products, the time taken for 75% completion is 60 minutes. How much time is required for 87.5% completion of the same reaction?",
        "options_json": json.dumps([
            "A) 90 minutes",
            "B) 120 minutes",
            "C) 80 minutes",
            "D) 70 minutes"
        ]),
        "correct_answer": "A",
        "explanation": "For 1st order reaction, 75% completion means 2 half-lives (100% -> 50% -> 25%). So 2 * t_1/2 = 60 min => t_1/2 = 30 min. 87.5% completion leaves 12.5% = 1/8 of initial, which is exactly 3 half-lives. Time required = 3 * 30 min = 90 min.",
        "concept": "First Order Kinetics and Half-life Relations",
        "common_mistake": "Setting up a linear proportion (60 min / 75 * 87.5 = 70 min) treating order as zero-order.",
        "mistake_categories_json": json.dumps(["CONCEPTUAL_MISUNDERSTANDING", "FORMULA_RECALL"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "jee-chem-002",
        "exam": "JEE",
        "subject": "Chemistry",
        "chapter": "Physical Chemistry",
        "topic": "Thermodynamics",
        "difficulty": "Hard",
        "question_text": "One mole of an ideal gas at 300 K expands isothermally and reversibly from 10 L to 20 L. What is the change in entropy of the surroundings (ΔS_surr)? (Given R = 8.314 J/mol·K, ln 2 = 0.693)",
        "options_json": json.dumps([
            "A) - 5.76 J/K",
            "B) + 5.76 J/K",
            "C) 0 J/K",
            "D) - 11.52 J/K"
        ]),
        "correct_answer": "A",
        "explanation": "For reversible process, ΔS_total = ΔS_sys + ΔS_surr = 0. For isothermal expansion of gas, ΔS_sys = n R ln(V2/V1) = 1 * 8.314 * ln 2 = +5.76 J/K. Therefore ΔS_surr = - ΔS_sys = - 5.76 J/K.",
        "concept": "Reversible Processes and Second Law Entropy Relations",
        "common_mistake": "Assuming ΔS_surr is 0 because the process is isothermal, or forgetting the negative sign.",
        "mistake_categories_json": json.dumps(["CARELESS_MISTAKE", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "jee-chem-003",
        "exam": "JEE",
        "subject": "Chemistry",
        "chapter": "Organic Chemistry",
        "topic": "Aldehydes and Ketones",
        "difficulty": "Medium",
        "question_text": "Which of the following compounds will undergo Cannizzaro reaction when treated with concentrated aqueous NaOH?",
        "options_json": json.dumps([
            "A) Benzaldehyde (C6H5CHO)",
            "B) Acetaldehyde (CH3CHO)",
            "C) Acetophenone (C6H5COCH3)",
            "D) Propionaldehyde (CH3CH2CHO)"
        ]),
        "correct_answer": "A",
        "explanation": "Cannizzaro reaction is undergone only by aldehydes that lack an α-hydrogen atom. Benzaldehyde has no α-hydrogen on the formyl carbon and undergoes disproportionation into benzyl alcohol and sodium benzoate. Acetaldehyde and propionaldehyde have α-hydrogens and undergo Aldol condensation.",
        "concept": "Cannizzaro Reaction vs Aldol Condensation Requirements",
        "common_mistake": "Confusing Cannizzaro with Aldol requirements and picking acetaldehyde CH3CHO.",
        "mistake_categories_json": json.dumps(["MEMORY_ERROR", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "NCERT",
        "year": 2024
    },
    {
        "id": "jee-chem-004",
        "exam": "JEE",
        "subject": "Chemistry",
        "chapter": "Inorganic Chemistry",
        "topic": "Coordination Compounds",
        "difficulty": "Hard",
        "question_text": "What is the magnetic behavior and hybridisation of [Fe(CN)6]3- and [FeF6]3- respectively? (Atomic number of Fe = 26)",
        "options_json": json.dumps([
            "A) d2sp3 (paramagnetic, 1 unpaired electron) and sp3d2 (paramagnetic, 5 unpaired electrons)",
            "B) sp3d2 (diamagnetic) and d2sp3 (paramagnetic, 5 unpaired electrons)",
            "C) d2sp3 (diamagnetic) and sp3d2 (paramagnetic, 3 unpaired electrons)",
            "D) d2sp3 (ferromagnetic) and sp3d2 (diamagnetic)"
        ]),
        "correct_answer": "A",
        "explanation": "Fe3+ is [Ar] 3d5. CN- is a strong field ligand (spectrochemical series), causing pairing: t2g5 eg0 -> 1 unpaired electron (μ = 1.73 BM, d2sp3 inner orbital complex). F- is a weak field ligand, keeping high spin t2g3 eg2 -> 5 unpaired electrons (μ = 5.92 BM, sp3d2 outer orbital complex).",
        "concept": "Crystal Field Splitting and Spectrochemical Series",
        "common_mistake": "Assuming Fe3+ with strong ligand pairs completely to 0 unpaired electrons, forgetting 5 is an odd number.",
        "mistake_categories_json": json.dumps(["CARELESS_MISTAKE", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "jee-chem-005",
        "exam": "JEE",
        "subject": "Chemistry",
        "chapter": "Physical Chemistry",
        "topic": "Electrochemistry",
        "difficulty": "Medium",
        "question_text": "The standard electrode potentials are: E°(Zn2+/Zn) = -0.76 V and E°(Cu2+/Cu) = +0.34 V. What is the standard EMF of the Daniel cell (Zn | Zn2+ || Cu2+ | Cu)?",
        "options_json": json.dumps([
            "A) + 1.10 V",
            "B) - 1.10 V",
            "C) + 0.42 V",
            "D) - 0.42 V"
        ]),
        "correct_answer": "A",
        "explanation": "E°_cell = E°_cathode - E°_anode = E°(Cu2+/Cu) - E°(Zn2+/Zn) = +0.34 V - (-0.76 V) = +1.10 V.",
        "concept": "Galvanic Cell Standard Potential Calculation",
        "common_mistake": "Adding the reduction potentials with wrong sign convention: 0.34 - 0.76 = -0.42 V.",
        "mistake_categories_json": json.dumps(["CALCULATION_ERROR", "FORMULA_RECALL"]),
        "source_type": "NCERT",
        "year": 2022
    },
    {
        "id": "jee-chem-006",
        "exam": "JEE",
        "subject": "Chemistry",
        "chapter": "Organic Chemistry",
        "topic": "General Organic Chemistry",
        "difficulty": "Medium",
        "question_text": "Arrange the following carbocations in order of increasing stability: (I) (CH3)3C+ , (II) CH3CH2+ , (III) (CH3)2CH+ , (IV) C6H5CH2+",
        "options_json": json.dumps([
            "A) II < III < I < IV",
            "B) II < III < IV < I",
            "C) IV < II < III < I",
            "D) III < II < I < IV"
        ]),
        "correct_answer": "B",
        "explanation": "CH3CH2+ (1°, 3 α-H) < (CH3)2CH+ (2°, 6 α-H) < C6H5CH2+ (resonance stabilized by phenyl ring) < (CH3)3C+ (3°, 9 hyperconjugative α-H). Note: In gas phase and aqueous standard JEE scale, tert-butyl carbocation with 9 hyperconjugative structures is more stable than unsubstituted benzyl carbocation.",
        "concept": "Carbocation Stability: Hyperconjugation vs Resonance",
        "common_mistake": "Assuming resonance always unconditionally beats hyperconjugation without counting 9 α-hydrogens.",
        "mistake_categories_json": json.dumps(["CONCEPTUAL_MISUNDERSTANDING", "WRONG_APPROACH"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "jee-chem-007",
        "exam": "JEE",
        "subject": "Chemistry",
        "chapter": "Inorganic Chemistry",
        "topic": "Chemical Bonding",
        "difficulty": "Easy",
        "question_text": "According to VSEPR theory, what is the geometric shape of the XeF4 molecule?",
        "options_json": json.dumps([
            "A) Square planar",
            "B) Tetrahedral",
            "C) Square pyramidal",
            "D) See-saw"
        ]),
        "correct_answer": "A",
        "explanation": "Xe has 8 valence electrons. In XeF4, there are 4 bonding pairs and 2 lone pairs. Steric number = 4 + 2 = 6 (sp3d2 hybridisation). The octahedral geometry with 2 lone pairs located at trans positions gives a square planar molecular geometry.",
        "concept": "VSEPR Theory and Molecular Geometry of Noble Gas Halides",
        "common_mistake": "Choosing tetrahedral by looking only at the 4 fluorine atoms without counting the 2 lone pairs on Xenon.",
        "mistake_categories_json": json.dumps(["CARELESS_MISTAKE", "FORMULA_RECALL"]),
        "source_type": "NCERT",
        "year": 2023
    },

    # ==================== JEE MATHEMATICS (7 questions) ====================
    {
        "id": "jee-math-001",
        "exam": "JEE",
        "subject": "Mathematics",
        "chapter": "Calculus",
        "topic": "Definite Integration",
        "difficulty": "Medium",
        "question_text": "Evaluate the definite integral: I = ∫[0 to π/2] (sin^3 x) / (sin^3 x + cos^3 x) dx.",
        "options_json": json.dumps([
            "A) π / 4",
            "B) π / 2",
            "C) π",
            "D) 0"
        ]),
        "correct_answer": "A",
        "explanation": "Using King's Property: ∫[a to b] f(x)dx = ∫[a to b] f(a+b-x)dx. Here f(π/2 - x) replaces sin with cos and cos with sin. I = ∫[0 to π/2] (cos^3 x) / (cos^3 x + sin^3 x) dx. Adding both equations: 2I = ∫[0 to π/2] 1 dx = π/2 => I = π/4.",
        "concept": "Definite Integrals and King's Property",
        "common_mistake": "Attempting reduction formula substitution or complex expansion instead of King's property.",
        "mistake_categories_json": json.dumps(["WRONG_APPROACH", "TIME_PRESSURE"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "jee-math-002",
        "exam": "JEE",
        "subject": "Mathematics",
        "chapter": "Calculus",
        "topic": "Differential Equations",
        "difficulty": "Hard",
        "question_text": "Find the integrating factor for the linear differential equation: (x + 2y^3) dy/dx = y (where y > 0).",
        "options_json": json.dumps([
            "A) 1 / y",
            "B) y",
            "C) 1 / y^2",
            "D) e^(-y)"
        ]),
        "correct_answer": "A",
        "explanation": "Invert the equation to linear in x: dx/dy = (x + 2y^3) / y = (1/y)x + 2y^2 => dx/dy - (1/y)x = 2y^2. Here P(y) = -1/y. Integrating factor IF = e^(∫ P(y) dy) = e^(∫ -1/y dy) = e^(-ln y) = 1/y.",
        "concept": "Linear Differential Equations with Dependent Variable Swap",
        "common_mistake": "Trying to solve as linear in y with dy/dx instead of inverting to dx/dy, getting stuck.",
        "mistake_categories_json": json.dumps(["WRONG_APPROACH", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "jee-math-003",
        "exam": "JEE",
        "subject": "Mathematics",
        "chapter": "Calculus",
        "topic": "Application of Derivatives",
        "difficulty": "Medium",
        "question_text": "What is the maximum area of a rectangle that can be inscribed in an ellipse with equation (x^2 / a^2) + (y^2 / b^2) = 1?",
        "options_json": json.dumps([
            "A) 2ab",
            "B) ab",
            "C) 4ab",
            "D) πab"
        ]),
        "correct_answer": "A",
        "explanation": "Let parametric coordinates of vertex in 1st quadrant be (a cos θ, b sin θ). Area of inscribed rectangle = 4 * (a cos θ) * (b sin θ) = 2ab (2 sin θ cos θ) = 2ab sin(2θ). Max value of sin(2θ) is 1 (at θ = π/4). Thus max area = 2ab.",
        "concept": "Optimization in Conic Sections using Parametric Coordinates",
        "common_mistake": "Confusing the 4 quadrants factor, or guessing the ellipse area πab.",
        "mistake_categories_json": json.dumps(["CALCULATION_ERROR", "FORMULA_RECALL"]),
        "source_type": "PYQ",
        "year": 2022
    },
    {
        "id": "jee-math-004",
        "exam": "JEE",
        "subject": "Mathematics",
        "chapter": "Algebra",
        "topic": "Matrices & Determinants",
        "difficulty": "Medium",
        "question_text": "If A is a non-singular square matrix of order 3 such that det(A) = 4, what is the value of det(2 · adj(A))?",
        "options_json": json.dumps([
            "A) 128",
            "B) 64",
            "C) 32",
            "D) 256"
        ]),
        "correct_answer": "A",
        "explanation": "For an n x n matrix: det(k M) = k^n det(M). For n = 3: det(2 · adj(A)) = 2^3 · det(adj(A)). Also det(adj(A)) = [det(A)]^(n-1) = 4^(3-1) = 4^2 = 16. Therefore, det(2 · adj(A)) = 8 · 16 = 128.",
        "concept": "Properties of Adjoint and Scalar Determinant Scaling",
        "common_mistake": "Pulling out scalar 2 without raising to the power of order 3 (calculating 2 * 16 = 32), or taking det(adj A) = det(A).",
        "mistake_categories_json": json.dumps(["FORMULA_RECALL", "CARELESS_MISTAKE"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "jee-math-005",
        "exam": "JEE",
        "subject": "Mathematics",
        "chapter": "Coordinate Geometry",
        "topic": "Conic Sections",
        "difficulty": "Hard",
        "question_text": "The locus of the point of intersection of two perpendicular tangents to the parabola y^2 = 4ax is:",
        "options_json": json.dumps([
            "A) x + a = 0 (Directrix)",
            "B) x - a = 0",
            "C) y = 0",
            "D) x^2 + y^2 = a^2"
        ]),
        "correct_answer": "A",
        "explanation": "Any tangent to y^2 = 4ax is y = mx + a/m => m^2 x - my + a = 0. If it passes through (h, k): m^2 h - mk + a = 0. For perpendicular tangents, the product of roots m1 * m2 = a / h = -1 => h = -a => x = -a (or x + a = 0), which is the directrix of the parabola.",
        "concept": "Director Circle of Parabola and Orthogonal Tangents",
        "common_mistake": "Confusing with the director circle of an ellipse or hyperbola (circle x^2 + y^2 = a^2 + b^2).",
        "mistake_categories_json": json.dumps(["FORMULA_RECALL", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "jee-math-006",
        "exam": "JEE",
        "subject": "Mathematics",
        "chapter": "Algebra",
        "topic": "Complex Numbers",
        "difficulty": "Medium",
        "question_text": "If ω is a non-real cube root of unity, what is the value of (1 - ω + ω^2)^5 + (1 + ω - ω^2)^5?",
        "options_json": json.dumps([
            "A) 32",
            "B) - 32",
            "C) 64",
            "D) 0"
        ]),
        "correct_answer": "A",
        "explanation": "Since 1 + ω + ω^2 = 0: (1 + ω^2) = -ω. First term: (-ω - ω)^5 = (-2ω)^5 = -32 ω^5 = -32 ω^2. Second term: (1 + ω) = -ω^2. Second term: (-ω^2 - ω^2)^5 = (-2ω^2)^5 = -32 ω^10 = -32 ω. Sum = -32 (ω^2 + ω) = -32 (-1) = 32.",
        "concept": "Cube Roots of Unity and Power Simplifications",
        "common_mistake": "Losing track of odd powers of negative signs, getting -32.",
        "mistake_categories_json": json.dumps(["CALCULATION_ERROR", "CARELESS_MISTAKE"]),
        "source_type": "NCERT",
        "year": 2023
    },
    {
        "id": "jee-math-007",
        "exam": "JEE",
        "subject": "Mathematics",
        "chapter": "Calculus",
        "topic": "Application of Derivatives",
        "difficulty": "Easy",
        "question_text": "At what point on the curve y = x^2 - 4x + 5 is the tangent parallel to the line 2x - y + 1 = 0?",
        "options_json": json.dumps([
            "A) (3, 2)",
            "B) (2, 1)",
            "C) (1, 2)",
            "D) (3, 4)"
        ]),
        "correct_answer": "A",
        "explanation": "Slope of line 2x - y + 1 = 0 is m = 2. Slope of tangent dy/dx = 2x - 4. Setting dy/dx = 2 => 2x - 4 = 2 => 2x = 6 => x = 3. Substituting x = 3 into curve: y = 3^2 - 4(3) + 5 = 9 - 12 + 5 = 2. Point is (3, 2).",
        "concept": "Slope of Tangent to Curves and Parallel Lines Condition",
        "common_mistake": "Setting derivative equal to the negative reciprocal (-1/2) as if finding normal.",
        "mistake_categories_json": json.dumps(["CARELESS_MISTAKE", "MISREAD_QUESTION"]),
        "source_type": "NCERT",
        "year": 2024
    },

    # ==================== NEET PHYSICS (7 questions) ====================
    {
        "id": "neet-phy-001",
        "exam": "NEET",
        "subject": "Physics",
        "chapter": "Mechanics",
        "topic": "Laws of Motion",
        "difficulty": "Easy",
        "question_text": "A lift of mass 1000 kg is moving upwards with an acceleration of 1 m/s^2. If g = 9.8 m/s^2, what is the tension in the supporting cable?",
        "options_json": json.dumps([
            "A) 10,800 N",
            "B) 8,800 N",
            "C) 9,800 N",
            "D) 1,000 N"
        ]),
        "correct_answer": "A",
        "explanation": "For an upward accelerating lift: T - mg = ma => T = m(g + a) = 1000 * (9.8 + 1) = 1000 * 10.8 = 10,800 N.",
        "concept": "Apparent Weight and Newton's Second Law in Accelerated Frames",
        "common_mistake": "Subtracting acceleration T = m(g - a) = 8,800 N, which occurs when the lift accelerates downward.",
        "mistake_categories_json": json.dumps(["FORMULA_RECALL", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "neet-phy-002",
        "exam": "NEET",
        "subject": "Physics",
        "chapter": "Mechanics",
        "topic": "Gravitation",
        "difficulty": "Medium",
        "question_text": "At what height above the Earth's surface does the acceleration due to gravity become 1/4th of its value on the surface? (R = Radius of Earth)",
        "options_json": json.dumps([
            "A) R",
            "B) 2R",
            "C) R / 2",
            "D) 4R"
        ]),
        "correct_answer": "A",
        "explanation": "g' = g / (1 + h/R)^2. Given g' = g/4: 1 / (1 + h/R)^2 = 1/4 => 1 + h/R = 2 => h/R = 1 => h = R.",
        "concept": "Variation of Gravitational Acceleration with Altitude",
        "common_mistake": "Using approximate linear formula g' = g(1 - 2h/R) which is valid only when h << R, giving wrong h = 3R/8.",
        "mistake_categories_json": json.dumps(["FORMULA_RECALL", "WRONG_APPROACH"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "neet-phy-003",
        "exam": "NEET",
        "subject": "Physics",
        "chapter": "Optics",
        "topic": "Ray Optics",
        "difficulty": "Medium",
        "question_text": "A convex lens of focal length 20 cm in air is immersed in water (refractive index of water = 4/3, glass = 3/2). What will be its new focal length?",
        "options_json": json.dumps([
            "A) 80 cm",
            "B) 40 cm",
            "C) 20 cm",
            "D) 10 cm"
        ]),
        "correct_answer": "A",
        "explanation": "Lens maker's formula: 1/f = (μ_rel - 1)(1/R1 - 1/R2). In air: 1/20 = (3/2 - 1) K = 1/2 K => K = 1/10. In water: μ_rel = (3/2)/(4/3) = 9/8. 1/f_w = (9/8 - 1) K = (1/8) * (1/10) = 1/80 => f_w = 80 cm.",
        "concept": "Lens Maker's Formula in Mediums",
        "common_mistake": "Multiplying the focal length by 4/3 directly instead of computing relative refractive index (μ_lens/μ_med - 1).",
        "mistake_categories_json": json.dumps(["CALCULATION_ERROR", "FORMULA_RECALL"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "neet-phy-004",
        "exam": "NEET",
        "subject": "Physics",
        "chapter": "Optics",
        "topic": "Wave Optics",
        "difficulty": "Medium",
        "question_text": "In Young's double slit experiment, if the distance between the slits is halved and distance between slits and screen is doubled, how does fringe width β change?",
        "options_json": json.dumps([
            "A) Becomes 4 times",
            "B) Becomes 2 times",
            "C) Remains unchanged",
            "D) Becomes 1/4th"
        ]),
        "correct_answer": "A",
        "explanation": "Fringe width β = λ D / d. When D' = 2D and d' = d/2: β' = λ (2D) / (d/2) = 4 (λ D / d) = 4 β.",
        "concept": "Young's Double Slit Fringe Spacing Dependency",
        "common_mistake": "Inverting the ratio and concluding β becomes unchanged or 1/4th.",
        "mistake_categories_json": json.dumps(["CARELESS_MISTAKE", "FORMULA_RECALL"]),
        "source_type": "NCERT",
        "year": 2022
    },
    {
        "id": "neet-phy-005",
        "exam": "NEET",
        "subject": "Physics",
        "chapter": "Thermodynamics",
        "topic": "Heat Engines",
        "difficulty": "Easy",
        "question_text": "A Carnot engine operates between temperatures 327°C and 27°C. What is its theoretical thermal efficiency?",
        "options_json": json.dumps([
            "A) 50%",
            "B) 91.7%",
            "C) 25%",
            "D) 75%"
        ]),
        "correct_answer": "A",
        "explanation": "Convert to Kelvin: T_hot = 327 + 273 = 600 K; T_cold = 27 + 273 = 300 K. Carnot efficiency η = 1 - T_cold / T_hot = 1 - 300 / 600 = 1 - 0.5 = 50%.",
        "concept": "Carnot Engine Maximum Thermal Efficiency",
        "common_mistake": "Using Celsius temperatures directly: η = 1 - 27/327 = 91.7% instead of absolute Kelvin.",
        "mistake_categories_json": json.dumps(["CONCEPTUAL_MISUNDERSTANDING", "CARELESS_MISTAKE"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "neet-phy-006",
        "exam": "NEET",
        "subject": "Physics",
        "chapter": "Electrodynamics",
        "topic": "Current Electricity",
        "difficulty": "Hard",
        "question_text": "A wire of resistance 16 Ω is elongated uniformly by stretching so that its length increases by 25%. What is the new resistance of the wire?",
        "options_json": json.dumps([
            "A) 25 Ω",
            "B) 20 Ω",
            "C) 24 Ω",
            "D) 18 Ω"
        ]),
        "correct_answer": "A",
        "explanation": "Since volume V = A * L remains constant, A = V / L. Resistance R = ρ L / A = ρ L^2 / V => R ∝ L^2. New length L' = 1.25 L = 5/4 L. New resistance R' = R * (5/4)^2 = 16 * (25/16) = 25 Ω.",
        "concept": "Resistance Scaling under Constant Volume Stretching",
        "common_mistake": "Assuming cross-sectional area remains unchanged and using R ∝ L to get 16 * 1.25 = 20 Ω.",
        "mistake_categories_json": json.dumps(["CONCEPTUAL_MISUNDERSTANDING", "WRONG_APPROACH"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "neet-phy-007",
        "exam": "NEET",
        "subject": "Physics",
        "chapter": "Mechanics",
        "topic": "Work-Energy-Power",
        "difficulty": "Easy",
        "question_text": "If kinetic energy of a body increases by 300%, by what percentage does its linear momentum increase?",
        "options_json": json.dumps([
            "A) 100%",
            "B) 200%",
            "C) 300%",
            "D) 50%"
        ]),
        "correct_answer": "A",
        "explanation": "Kinetic energy KE = p^2 / (2m) => p = √(2m · KE). When KE increases by 300%, new KE' = KE + 3KE = 4 KE. Thus p' = √(4) p = 2p. Percentage increase in momentum = [(2p - p)/p] * 100% = 100%.",
        "concept": "Relationship between Linear Momentum and Kinetic Energy",
        "common_mistake": "Confusing 300% increase with 3 times final value (which gives √3 ≈ 1.732 - 1 = 73%).",
        "mistake_categories_json": json.dumps(["CALCULATION_ERROR", "MISREAD_QUESTION"]),
        "source_type": "NCERT",
        "year": 2023
    },

    # ==================== NEET CHEMISTRY (7 questions) ====================
    {
        "id": "neet-chem-001",
        "exam": "NEET",
        "subject": "Chemistry",
        "chapter": "Physical Chemistry",
        "topic": "Equilibrium",
        "difficulty": "Medium",
        "question_text": "What is the pH of a 10^(-8) M aqueous solution of HCl at 25°C?",
        "options_json": json.dumps([
            "A) Between 6.95 and 7.00",
            "B) 8.00",
            "C) 6.00",
            "D) 7.00 exactly"
        ]),
        "correct_answer": "A",
        "explanation": "An acid solution cannot be basic (pH cannot be 8). In extremely dilute acids, H+ from auto-ionization of water (10^-7 M) must be considered: [H+]_total = 10^-8 + 10^-7 = 1.1 * 10^-7 M. pH = -log(1.1 * 10^-7) ≈ 7 - 0.041 = 6.96.",
        "concept": "pH Calculation in Ultra-Dilute Strong Acids",
        "common_mistake": "Blindly applying pH = -log(10^-8) = 8, asserting that an acidic solution is alkaline.",
        "mistake_categories_json": json.dumps(["CONCEPTUAL_MISUNDERSTANDING", "CARELESS_MISTAKE"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "neet-chem-002",
        "exam": "NEET",
        "subject": "Chemistry",
        "chapter": "Physical Chemistry",
        "topic": "Solutions",
        "difficulty": "Medium",
        "question_text": "Which of the following 0.1 M aqueous solutions will exhibit the highest boiling point elevation?",
        "options_json": json.dumps([
            "A) Al2(SO4)3",
            "B) NaCl",
            "C) BaCl2",
            "D) Glucose"
        ]),
        "correct_answer": "A",
        "explanation": "Boiling point elevation ΔTb = i * Kb * m. For non-electrolyte glucose, i = 1. For NaCl, i = 2. For BaCl2, i = 3. For Al2(SO4)3 -> 2 Al3+ + 3 SO4 2-, i = 5. Highest vant Hoff factor i yields the largest elevation.",
        "concept": "Colligative Properties and Vant Hoff Factor",
        "common_mistake": "Neglecting ionization and treating all 0.1 M solutions as having identical colligative effect.",
        "mistake_categories_json": json.dumps(["FORMULA_RECALL", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "neet-chem-003",
        "exam": "NEET",
        "subject": "Chemistry",
        "chapter": "Organic Chemistry",
        "topic": "Biomolecules",
        "difficulty": "Easy",
        "question_text": "Which nitrogenous base is present in DNA but absent in RNA?",
        "options_json": json.dumps([
            "A) Thymine",
            "B) Uracil",
            "C) Guanine",
            "D) Cytosine"
        ]),
        "correct_answer": "A",
        "explanation": "DNA contains Adenine, Guanine, Cytosine, and Thymine. In RNA, Thymine is replaced by Uracil (5-methyluracil is thymine).",
        "concept": "Nucleic Acid Base Composition",
        "common_mistake": "Confusing Uracil (absent in DNA) with Thymine (absent in RNA).",
        "mistake_categories_json": json.dumps(["MEMORY_ERROR", "MISREAD_QUESTION"]),
        "source_type": "NCERT",
        "year": 2024
    },
    {
        "id": "neet-chem-004",
        "exam": "NEET",
        "subject": "Chemistry",
        "chapter": "Organic Chemistry",
        "topic": "Amines",
        "difficulty": "Hard",
        "question_text": "Carbylamine test is positive for which class of organic amines?",
        "options_json": json.dumps([
            "A) Primary aliphatic and aromatic amines only",
            "B) Secondary aliphatic amines only",
            "C) Tertiary aliphatic amines only",
            "D) All aliphatic amines regardless of degree"
        ]),
        "correct_answer": "A",
        "explanation": "Carbylamine reaction (isocyanide test) involves warming a primary amine with chloroform and alcoholic KOH to produce an extremely foul-smelling isocyanide. It is given strictly by 1° amines (both aliphatic and aromatic). Secondary and tertiary amines do not show this reaction.",
        "concept": "Distinction Tests for Amines: Carbylamine Reaction",
        "common_mistake": "Assuming only aliphatic primary amines react, or including secondary amines.",
        "mistake_categories_json": json.dumps(["MEMORY_ERROR", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "NCERT",
        "year": 2023
    },
    {
        "id": "neet-chem-005",
        "exam": "NEET",
        "subject": "Chemistry",
        "chapter": "Inorganic Chemistry",
        "topic": "p-Block Elements",
        "difficulty": "Medium",
        "question_text": "Which of the following oxoacids of phosphorus acts as the strongest reducing agent?",
        "options_json": json.dumps([
            "A) H3PO2 (Hypophosphorous acid)",
            "B) H3PO3 (Phosphorous acid)",
            "C) H3PO4 (Orthophosphoric acid)",
            "D) H4P2O7 (Pyrophosphoric acid)"
        ]),
        "correct_answer": "A",
        "explanation": "Reducing nature of oxoacids of phosphorus depends directly on the number of P-H bonds. H3PO2 has two P-H bonds and one P-OH bond. H3PO3 has one P-H bond. H3PO4 has zero P-H bonds. Thus H3PO2 is the strongest reducing agent.",
        "concept": "Structure and Reducing Property of Phosphorus Oxoacids",
        "common_mistake": "Assuming lowest oxidation number always equates to highest OH count, or picking H3PO4 because it contains more oxygen.",
        "mistake_categories_json": json.dumps(["CONCEPTUAL_MISUNDERSTANDING", "MEMORY_ERROR"]),
        "source_type": "PYQ",
        "year": 2024
    },
    {
        "id": "neet-chem-006",
        "exam": "NEET",
        "subject": "Chemistry",
        "chapter": "Physical Chemistry",
        "topic": "Chemical Kinetics",
        "difficulty": "Easy",
        "question_text": "What are the units of rate constant (k) for a zero order reaction?",
        "options_json": json.dumps([
            "A) mol L^(-1) s^(-1)",
            "B) s^(-1)",
            "C) L mol^(-1) s^(-1)",
            "D) L^2 mol^(-2) s^(-1)"
        ]),
        "correct_answer": "A",
        "explanation": "Rate = k [A]^0 = k. Rate unit is always concentration/time = mol L^-1 s^-1. Hence for zero order, k has identical units: mol L^-1 s^-1.",
        "concept": "Reaction Order and Dimensional Analysis of Rate Constants",
        "common_mistake": "Confusing zero order (mol L^-1 s^-1) with first order (s^-1).",
        "mistake_categories_json": json.dumps(["CARELESS_MISTAKE", "FORMULA_RECALL"]),
        "source_type": "NCERT",
        "year": 2022
    },
    {
        "id": "neet-chem-007",
        "exam": "NEET",
        "subject": "Chemistry",
        "chapter": "Inorganic Chemistry",
        "topic": "Periodic Table & Periodicity",
        "difficulty": "Medium",
        "question_text": "Which element has the highest electron gain enthalpy (most negative ΔegH) among the halogens?",
        "options_json": json.dumps([
            "A) Chlorine (Cl)",
            "B) Fluorine (F)",
            "C) Bromine (Br)",
            "D) Iodine (I)"
        ]),
        "correct_answer": "A",
        "explanation": "Due to extremely small compact 2p subshell in fluorine, incoming electron experiences high interelectronic repulsions. Chlorine's 3p subshell is larger and accommodates the incoming electron with less repulsion, giving Chlorine the most negative electron gain enthalpy in the periodic table.",
        "concept": "Anomalous Electronic Repulsion in Period 2 vs Period 3 Elements",
        "common_mistake": "Selecting Fluorine assuming electronegativity trend directly mirrors electron gain enthalpy.",
        "mistake_categories_json": json.dumps(["CONCEPTUAL_MISUNDERSTANDING", "MEMORY_ERROR"]),
        "source_type": "PYQ",
        "year": 2023
    },

    # ==================== NEET BIOLOGY (7 questions) ====================
    {
        "id": "neet-bio-001",
        "exam": "NEET",
        "subject": "Biology",
        "chapter": "Genetics & Evolution",
        "topic": "Mendelian Genetics",
        "difficulty": "Medium",
        "question_text": "In a dihybrid cross between two heterozygous individuals (AaBb x AaBb) with independent assortment, what is the expected phenotypic ratio?",
        "options_json": json.dumps([
            "A) 9 : 3 : 3 : 1",
            "B) 1 : 2 : 1",
            "C) 3 : 1",
            "D) 9 : 3 : 4"
        ]),
        "correct_answer": "A",
        "explanation": "According to Mendel's law of independent assortment, crossing two dihybrid heterozygotes yields a 9:3:3:1 phenotypic ratio (9 dominant-dominant, 3 dominant-recessive, 3 recessive-dominant, 1 recessive-recessive).",
        "concept": "Dihybrid Cross and Independent Assortment Law",
        "common_mistake": "Confusing dihybrid ratio with epistatic modifications (such as 9:3:4 for supplementary genes).",
        "mistake_categories_json": json.dumps(["MEMORY_ERROR", "CARELESS_MISTAKE"]),
        "source_type": "NCERT",
        "year": 2024
    },
    {
        "id": "neet-bio-002",
        "exam": "NEET",
        "subject": "Biology",
        "chapter": "Genetics & Evolution",
        "topic": "Molecular Basis of Inheritance",
        "difficulty": "Hard",
        "question_text": "During DNA replication, which enzyme is primarily responsible for removing RNA primers and replacing them with deoxynucleotides in prokaryotes?",
        "options_json": json.dumps([
            "A) DNA Polymerase I",
            "B) DNA Polymerase III",
            "C) DNA Ligase",
            "D) Helicase"
        ]),
        "correct_answer": "A",
        "explanation": "DNA Polymerase I possesses 5' to 3' exonuclease activity which removes the RNA primers from Okazaki fragments and fills the gaps with appropriate deoxynucleotides (nick translation). DNA Pol III is the primary replicative polymerase.",
        "concept": "Enzymology of DNA Replication in Prokaryotes",
        "common_mistake": "Selecting DNA Polymerase III, which synthesizes the bulk of the strand but lacks 5' -> 3' exonuclease primer removal activity.",
        "mistake_categories_json": json.dumps(["CONCEPTUAL_MISUNDERSTANDING", "MEMORY_ERROR"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "neet-bio-003",
        "exam": "NEET",
        "subject": "Biology",
        "chapter": "Human Physiology",
        "topic": "Circulatory System",
        "difficulty": "Medium",
        "question_text": "In a standard Electrocardiogram (ECG), what does the QRS complex represent?",
        "options_json": json.dumps([
            "A) Depolarisation of the ventricles",
            "B) Depolarisation of the atria",
            "C) Repolarisation of the ventricles",
            "D) Repolarisation of the atria"
        ]),
        "correct_answer": "A",
        "explanation": "In an ECG: P wave represents atrial depolarisation; QRS complex represents rapid ventricular depolarisation which initiates ventricular contraction; T wave represents ventricular repolarisation.",
        "concept": "Standard Electrocardiogram (ECG) Wave Interpretation",
        "common_mistake": "Confusing ventricular depolarisation (QRS) with ventricular repolarisation (T wave).",
        "mistake_categories_json": json.dumps(["MEMORY_ERROR", "CARELESS_MISTAKE"]),
        "source_type": "NCERT",
        "year": 2024
    },
    {
        "id": "neet-bio-004",
        "exam": "NEET",
        "subject": "Biology",
        "chapter": "Human Physiology",
        "topic": "Neural Control & Coordination",
        "difficulty": "Hard",
        "question_text": "During the transmission of a nerve impulse, the sudden rapid influx of which ion causes depolarisation of the axolemma?",
        "options_json": json.dumps([
            "A) Na+ ions",
            "B) K+ ions",
            "C) Ca2+ ions",
            "D) Cl- ions"
        ]),
        "correct_answer": "A",
        "explanation": "When a threshold stimulus arrives, voltage-gated Na+ channels open rapidly, allowing an influx of Na+ into the axoplasm down the electrochemical gradient. This reverses polarity from -70 mV to +30 mV (depolarisation).",
        "concept": "Action Potential Generation and Ion Flux Mechanisms",
        "common_mistake": "Picking K+ ions, whose efflux causes repolarisation, or Ca2+ which triggers synaptic vesicle release at the terminal.",
        "mistake_categories_json": json.dumps(["CONCEPTUAL_MISUNDERSTANDING", "MEMORY_ERROR"]),
        "source_type": "PYQ",
        "year": 2023
    },
    {
        "id": "neet-bio-005",
        "exam": "NEET",
        "subject": "Biology",
        "chapter": "Plant Physiology",
        "topic": "Photosynthesis",
        "difficulty": "Medium",
        "question_text": "What is the primary CO2 acceptor molecule in C4 plants?",
        "options_json": json.dumps([
            "A) Phosphoenolpyruvate (PEP)",
            "B) Ribulose-1,5-bisphosphate (RuBP)",
            "C) Oxaloacetic acid (OAA)",
            "D) Phosphoglycerate (PGA)"
        ]),
        "correct_answer": "A",
        "explanation": "In C4 plants (like maize and sugarcane), the primary CO2 acceptor in mesophyll cells is the 3-carbon compound Phosphoenolpyruvate (PEP), catalyzed by PEP carboxylase. Oxaloacetate is the first stable 4-C product.",
        "concept": "C4 Dicarboxylic Acid Pathway (Hatch-Slack Pathway)",
        "common_mistake": "Confusing primary acceptor (PEP) with the first stable product formed (OAA), or confusing with C3 acceptor (RuBP).",
        "mistake_categories_json": json.dumps(["CARELESS_MISTAKE", "CONCEPTUAL_MISUNDERSTANDING"]),
        "source_type": "NCERT",
        "year": 2024
    },
    {
        "id": "neet-bio-006",
        "exam": "NEET",
        "subject": "Biology",
        "chapter": "Cell Biology",
        "topic": "Cell Division",
        "difficulty": "Easy",
        "question_text": "During which sub-stage of Prophase I in meiosis does crossing over and genetic recombination occur?",
        "options_json": json.dumps([
            "A) Pachytene",
            "B) Leptotene",
            "C) Zygotene",
            "D) Diplotene"
        ]),
        "correct_answer": "A",
        "explanation": "Crossing over between non-sister chromatids of homologous chromosomes occurs during Pachytene stage, facilitated by the recombinase enzyme complex. Zygotene involves synapsis, and Diplotene involves chiasmata visualization.",
        "concept": "Stages of Meiotic Prophase I",
        "common_mistake": "Confusing Zygotene (synapsis) or Diplotene (dissolution of synaptonemal complex) with Pachytene (crossing over).",
        "mistake_categories_json": json.dumps(["MEMORY_ERROR", "CARELESS_MISTAKE"]),
        "source_type": "NCERT",
        "year": 2023
    },
    {
        "id": "neet-bio-007",
        "exam": "NEET",
        "subject": "Biology",
        "chapter": "Plant Physiology",
        "topic": "Respiration in Plants",
        "difficulty": "Medium",
        "question_text": "How many ATP molecules are net produced directly via substrate-level phosphorylation during one complete turn of the citric acid (Krebs) cycle?",
        "options_json": json.dumps([
            "A) 1",
            "B) 2",
            "C) 3",
            "D) 36"
        ]),
        "correct_answer": "A",
        "explanation": "During one turn of Krebs cycle (per molecule of acetyl-CoA), succinyl-CoA is converted to succinate with phosphorylation of GDP to GTP (or ADP to ATP directly). This yields exactly 1 ATP via substrate-level phosphorylation. (Per glucose molecule, there are 2 turns, yielding 2 ATP).",
        "concept": "Substrate-Level vs Oxidative Phosphorylation in Krebs Cycle",
        "common_mistake": "Counting 2 ATP by assuming per glucose without noticing the question specified 'one complete turn' of the cycle.",
        "mistake_categories_json": json.dumps(["MISREAD_QUESTION", "CARELESS_MISTAKE"]),
        "source_type": "PYQ",
        "year": 2024
    }
]

TESTS_DATA = [
    {
        "id": "jee-full-mock-1",
        "title": "JEE Main Full Simulation Mock 1",
        "exam": "JEE",
        "test_type": "Full Simulation",
        "subject": "All Subjects",
        "chapter": "Complete Syllabus",
        "questions_count": 21,
        "duration_minutes": 45,
        "total_marks": 84,
        "marking_correct": 4,
        "marking_incorrect": -1,
        "marking_unattempted": 0,
        "difficulty": "Medium",
        "question_ids_json": json.dumps([
            "jee-phy-001", "jee-phy-002", "jee-phy-003", "jee-phy-004", "jee-phy-005", "jee-phy-006", "jee-phy-007",
            "jee-chem-001", "jee-chem-002", "jee-chem-003", "jee-chem-004", "jee-chem-005", "jee-chem-006", "jee-chem-007",
            "jee-math-001", "jee-math-002", "jee-math-003", "jee-math-004", "jee-math-005", "jee-math-006", "jee-math-007"
        ])
    },
    {
        "id": "jee-phy-subject-1",
        "title": "JEE Physics Mechanics & Electrodynamics Subject Test",
        "exam": "JEE",
        "test_type": "Subject Test",
        "subject": "Physics",
        "chapter": "Mechanics & Electrodynamics",
        "questions_count": 7,
        "duration_minutes": 15,
        "total_marks": 28,
        "marking_correct": 4,
        "marking_incorrect": -1,
        "marking_unattempted": 0,
        "difficulty": "Hard",
        "question_ids_json": json.dumps([
            "jee-phy-001", "jee-phy-002", "jee-phy-003", "jee-phy-004", "jee-phy-005", "jee-phy-006", "jee-phy-007"
        ])
    },
    {
        "id": "neet-full-mock-1",
        "title": "NEET Diagnostic Full Simulation Mock 1",
        "exam": "NEET",
        "test_type": "Full Simulation",
        "subject": "All Subjects",
        "chapter": "Complete Syllabus",
        "questions_count": 21,
        "duration_minutes": 30,
        "total_marks": 84,
        "marking_correct": 4,
        "marking_incorrect": -1,
        "marking_unattempted": 0,
        "difficulty": "Medium",
        "question_ids_json": json.dumps([
            "neet-phy-001", "neet-phy-002", "neet-phy-003", "neet-phy-004", "neet-phy-005", "neet-phy-006", "neet-phy-007",
            "neet-chem-001", "neet-chem-002", "neet-chem-003", "neet-chem-004", "neet-chem-005", "neet-chem-006", "neet-chem-007",
            "neet-bio-001", "neet-bio-002", "neet-bio-003", "neet-bio-004", "neet-bio-005", "neet-bio-006", "neet-bio-007"
        ])
    }
]

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Seed default user
    cursor.execute("""
    INSERT OR REPLACE INTO users (id, email, name, target_exam, avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        "user_demo",
        "aditya.sharma@jee2026.in",
        "Aditya Sharma",
        "JEE",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        "2026-05-01T08:00:00Z"
    ))

    # Seed questions
    for q in QUESTIONS_DATA:
        cursor.execute("""
        INSERT OR REPLACE INTO questions (
            id, exam, subject, chapter, topic, difficulty,
            question_text, options_json, correct_answer, explanation,
            concept, common_mistake, mistake_categories_json, source_type, year
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            q["id"], q["exam"], q["subject"], q["chapter"], q["topic"], q["difficulty"],
            q["question_text"], q["options_json"], q["correct_answer"], q["explanation"],
            q["concept"], q["common_mistake"], q["mistake_categories_json"], q["source_type"], q["year"]
        ))

    # Seed tests
    for t in TESTS_DATA:
        cursor.execute("""
        INSERT OR REPLACE INTO tests (
            id, title, exam, test_type, subject, chapter, questions_count,
            duration_minutes, total_marks, marking_correct, marking_incorrect,
            marking_unattempted, difficulty, question_ids_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t["id"], t["title"], t["exam"], t["test_type"], t["subject"], t["chapter"],
            t["questions_count"], t["duration_minutes"], t["total_marks"],
            t["marking_correct"], t["marking_incorrect"], t["marking_unattempted"],
            t["difficulty"], t["question_ids_json"]
        ))

    # Seed realistic 6-month historical activity (so contribution grid shows genuine consistency)
    # Check if attempts already exist
    cursor.execute("SELECT COUNT(*) FROM question_attempts WHERE user_id = 'user_demo'")
    count = cursor.fetchone()[0]

    if count == 0:
        print("Seeding realistic historical activity for past 180 days...")
        # Today is 2026-10-22
        today = datetime.date(2026, 10, 22)
        random.seed(42) # Deterministic realistic seed

        # Pattern: Active on most days, streaks of 4-12 days, rest days on occasional Sundays
        current_date = today - datetime.timedelta(days=180)
        
        jee_questions = [q for q in QUESTIONS_DATA if q["exam"] == "JEE"]
        
        while current_date <= today:
            date_str = current_date.isoformat()
            weekday = current_date.weekday() # 0 = Mon, 6 = Sun
            
            # 82% probability of practice day
            is_practice_day = random.random() < 0.82
            if current_date == today:
                # Make today have 8 solved questions already to demonstrate current activity
                is_practice_day = True
                daily_count = 8
            elif is_practice_day:
                # Random questions between 6 and 35
                r = random.random()
                if r < 0.35:
                    daily_count = random.randint(5, 10)
                elif r < 0.75:
                    daily_count = random.randint(12, 24)
                else:
                    daily_count = random.randint(25, 42)
            else:
                daily_count = 0

            for i in range(daily_count):
                q = random.choice(jee_questions)
                # 72% overall accuracy, but in Rotational Motion only ~42%
                if q["topic"] == "Rotational Motion":
                    is_corr = 1 if random.random() < 0.42 else 0
                elif q["subject"] == "Mathematics":
                    is_corr = 1 if random.random() < 0.65 else 0
                else:
                    is_corr = 1 if random.random() < 0.76 else 0
                
                selected = q["correct_answer"] if is_corr else random.choice([opt for opt in ["A", "B", "C", "D"] if opt != q["correct_answer"]])
                mistake_type = None
                ai_diag = None
                
                if not is_corr:
                    if q["topic"] == "Rotational Motion":
                        mistake_type = "FORMULA_RECALL"
                        ai_diag = json.dumps({
                            "mistakeType": "FORMULA_RECALL",
                            "confidence": 0.91,
                            "diagnosis": "Selected translational equation for a rotational-motion case or applied incorrect moment of inertia factor.",
                            "conceptGap": "Moment of inertia relationship in rolling constraints",
                            "recommendation": "Review distinction between translational and rotational equations before attempting another question."
                        })
                    else:
                        cats = json.loads(q["mistake_categories_json"])
                        mistake_type = cats[0] if cats else "CONCEPTUAL_MISUNDERSTANDING"
                        ai_diag = json.dumps({
                            "mistakeType": mistake_type,
                            "confidence": 0.88,
                            "diagnosis": f"Error identified under {q['concept']}.",
                            "conceptGap": q["concept"],
                            "recommendation": f"Practice foundational questions in {q['chapter']} - {q['topic']}."
                        })

                time_taken = random.randint(35, 120)
                attempt_time = f"{date_str}T{random.randint(9, 21):02d}:{random.randint(10, 58):02d}:00Z"
                
                cursor.execute("""
                INSERT INTO question_attempts (
                    id, attempt_id, user_id, question_id, selected_answer, correct_answer,
                    is_correct, time_taken_seconds, timestamp, activity_date,
                    exam, subject, chapter, topic, difficulty, mistake_type, ai_diagnosis_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"seed-qa-{date_str}-{i}",
                    f"seed-session-{date_str}",
                    "user_demo",
                    q["id"],
                    selected,
                    q["correct_answer"],
                    is_corr,
                    time_taken,
                    attempt_time,
                    date_str,
                    q["exam"],
                    q["subject"],
                    q["chapter"],
                    q["topic"],
                    q["difficulty"],
                    mistake_type,
                    ai_diag
                ))

            current_date += datetime.timedelta(days=1)

        # Seed pre-existing weakness in Rotational Motion
        cursor.execute("""
        INSERT OR REPLACE INTO weaknesses (
            id, user_id, exam, subject, chapter, topic, mistake_type,
            occurrences, accuracy_percent, last_seen, trend
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "weakness-rot-01",
            "user_demo",
            "JEE",
            "Physics",
            "Mechanics",
            "Rotational Motion",
            "FORMULA_RECALL",
            7,
            42.0,
            "2026-10-22T19:30:00Z",
            "recurring"
        ))

        cursor.execute("""
        INSERT OR REPLACE INTO weaknesses (
            id, user_id, exam, subject, chapter, topic, mistake_type,
            occurrences, accuracy_percent, last_seen, trend
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "weakness-calc-02",
            "user_demo",
            "JEE",
            "Mathematics",
            "Calculus",
            "Differential Equations",
            "WRONG_APPROACH",
            4,
            50.0,
            "2026-10-21T18:15:00Z",
            "recurring"
        ))

        cursor.execute("""
        INSERT OR REPLACE INTO weaknesses (
            id, user_id, exam, subject, chapter, topic, mistake_type,
            occurrences, accuracy_percent, last_seen, trend
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "weakness-chem-03",
            "user_demo",
            "JEE",
            "Chemistry",
            "Physical Chemistry",
            "Thermodynamics",
            "CARELESS_MISTAKE",
            3,
            55.0,
            "2026-10-20T14:40:00Z",
            "improving"
        ))

    conn.commit()
    conn.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_database()
