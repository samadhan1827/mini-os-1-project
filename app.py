from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


# -------------------------------------------------
# SSTF - Shortest Seek Time First
# -------------------------------------------------
def sstf(requests, head):
    pending = requests.copy()
    sequence = []
    current = head
    total_movement = 0

    while pending:
        next_request = min(
            pending,
            key=lambda request: abs(request - current)
        )

        total_movement += abs(next_request - current)
        current = next_request
        sequence.append(next_request)
        pending.remove(next_request)

    return sequence, total_movement


# -------------------------------------------------
# LOOK
# -------------------------------------------------
def look(requests, head, direction):
    requests = sorted(set(requests))

    left = [x for x in requests if x < head]
    right = [x for x in requests if x >= head]

    sequence = []
    current = head
    total_movement = 0

    if direction == "right":

        # Move towards larger cylinder numbers
        for request in right:
            total_movement += abs(request - current)
            current = request
            sequence.append(request)

        # Reverse direction at the last request
        for request in reversed(left):
            total_movement += abs(request - current)
            current = request
            sequence.append(request)

    else:

        # Move towards smaller cylinder numbers
        for request in reversed(left):
            total_movement += abs(request - current)
            current = request
            sequence.append(request)

        # Reverse direction at the first request
        for request in right:
            total_movement += abs(request - current)
            current = request
            sequence.append(request)

    return sequence, total_movement


# -------------------------------------------------
# C-LOOK
# -------------------------------------------------
def clook(requests, head, direction):
    requests = sorted(set(requests))

    left = [x for x in requests if x < head]
    right = [x for x in requests if x >= head]

    sequence = []
    current = head
    total_movement = 0

    if direction == "right":

        # Move right
        for request in right:
            total_movement += abs(request - current)
            current = request
            sequence.append(request)

        # Circular jump to smallest request
        if left:
            total_movement += abs(current - left[0])
            current = left[0]
            sequence.append(left[0])

            for request in left[1:]:
                total_movement += abs(request - current)
                current = request
                sequence.append(request)

    else:

        # Move left
        for request in reversed(left):
            total_movement += abs(request - current)
            current = request
            sequence.append(request)

        # Circular jump to largest request
        if right:
            total_movement += abs(current - right[-1])
            current = right[-1]
            sequence.append(right[-1])

            for request in reversed(right[:-1]):
                total_movement += abs(request - current)
                current = request
                sequence.append(request)

    return sequence, total_movement


# -------------------------------------------------
# Home page
# -------------------------------------------------
@app.route("/")
def home():
    return render_template("index.html")


# -------------------------------------------------
# Calculate algorithms
# -------------------------------------------------
@app.route("/calculate", methods=["POST"])
def calculate():

    try:
        data = request.get_json()

        head = int(data["head"])
        requests = [int(x) for x in data["requests"]]
        direction = data["direction"]

        # Validation
        if head < 0:
            return jsonify({"error": "Head position cannot be negative."}), 400

        if not requests:
            return jsonify({"error": "Enter at least one disk request."}), 400

        if any(x < 0 for x in requests):
            return jsonify({"error": "Cylinder numbers cannot be negative."}), 400

        # Run algorithms
        sstf_sequence, sstf_movement = sstf(
            requests,
            head
        )

        look_sequence, look_movement = look(
            requests,
            head,
            direction
        )

        clook_sequence, clook_movement = clook(
            requests,
            head,
            direction
        )

        movements = {
            "SSTF": sstf_movement,
            "LOOK": look_movement,
            "C-LOOK": clook_movement
        }

        best_algorithm = min(
            movements,
            key=movements.get
        )

        return jsonify({
            "initial_head": head,
            "requests": requests,
            "direction": direction,

            "sstf": {
                "sequence": sstf_sequence,
                "movement": sstf_movement
            },

            "look": {
                "sequence": look_sequence,
                "movement": look_movement
            },

            "clook": {
                "sequence": clook_sequence,
                "movement": clook_movement
            },

            "best_algorithm": best_algorithm
        })

    except (ValueError, TypeError, KeyError):
        return jsonify({
            "error": "Please enter valid input."
        }), 400


if __name__ == "__main__":
    app.run(debug=True)
