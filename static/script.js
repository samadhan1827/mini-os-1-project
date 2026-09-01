function calculate() {

    const errorElement =
        document.getElementById("error");

    errorElement.textContent = "";


    // -----------------------------
    // Get input
    // -----------------------------

    const head =
        parseInt(
            document.getElementById("head").value
        );

    const diskSize =
        parseInt(
            document.getElementById("diskSize").value
        );

    const requestText =
        document.getElementById("requests").value;

    const direction =
        document.getElementById("direction").value;


    // -----------------------------
    // Validate basic input
    // -----------------------------

    if (isNaN(head)) {
        errorElement.textContent =
            "Please enter the initial head position.";
        return;
    }

    if (isNaN(diskSize) || diskSize <= 0) {
        errorElement.textContent =
            "Please enter a valid disk size.";
        return;
    }

    if (head >= diskSize) {
        errorElement.textContent =
            "Head position must be smaller than disk size.";
        return;
    }


    // -----------------------------
    // Convert requests to numbers
    // -----------------------------

    const requests =
        requestText
        .split(",")
        .map(value => value.trim())
        .filter(value => value !== "")
        .map(value => Number(value));


    if (requests.length === 0 ||
        requests.some(value => isNaN(value))) {

        errorElement.textContent =
            "Please enter valid disk requests separated by commas.";

        return;
    }


    // Check cylinder range

    if (requests.some(
        value => value < 0 || value >= diskSize
    )) {

        errorElement.textContent =
            "All requests must be between 0 and " +
            (diskSize - 1) + ".";

        return;
    }


    // -----------------------------
    // Send data to Flask
    // -----------------------------

    fetch("/calculate", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            head: head,

            requests: requests,

            direction: direction

        })

    })

    .then(response => {

        if (!response.ok) {
            return response.json()
                .then(data => {
                    throw new Error(data.error);
                });
        }

        return response.json();

    })

    .then(data => {

        displayResults(
            data,
            diskSize
        );

    })

    .catch(error => {

        errorElement.textContent =
            error.message || "Something went wrong.";

    });
}


/* --------------------------------
   Display results
-------------------------------- */

function displayResults(data, diskSize) {

    document.getElementById("results")
        .style.display = "block";


    // Initial information

    document.getElementById("initialHead")
        .textContent = data.initial_head;

    document.getElementById("initialDirection")
        .textContent =
        data.direction === "right"
        ? "Right →"
        : "Left ←";


    // -----------------------------
    // SSTF
    // -----------------------------

    document.getElementById("sstfMovement")
        .textContent =
        data.sstf.movement;

    document.getElementById("sstfSequence")
        .textContent =
        createSequence(
            data.initial_head,
            data.sstf.sequence
        );

    drawMiniTimeline(
        "sstfVisualization",
        data.initial_head,
        data.sstf.sequence
    );


    // -----------------------------
    // LOOK
    // -----------------------------

    document.getElementById("lookMovement")
        .textContent =
        data.look.movement;

    document.getElementById("lookSequence")
        .textContent =
        createSequence(
            data.initial_head,
            data.look.sequence
        );

    drawMiniTimeline(
        "lookVisualization",
        data.initial_head,
        data.look.sequence
    );


    // -----------------------------
    // C-LOOK
    // -----------------------------

    document.getElementById("clookMovement")
        .textContent =
        data.clook.movement;

    document.getElementById("clookSequence")
        .textContent =
        createSequence(
            data.initial_head,
            data.clook.sequence
        );

    drawMiniTimeline(
        "clookVisualization",
        data.initial_head,
        data.clook.sequence
    );


    // -----------------------------
    // Comparison bars
    // -----------------------------

    const values = [

        data.sstf.movement,

        data.look.movement,

        data.clook.movement

    ];

    const maximum =
        Math.max(...values);


    setBar(
        "sstfBar",
        "sstfBarValue",
        data.sstf.movement,
        maximum
    );

    setBar(
        "lookBar",
        "lookBarValue",
        data.look.movement,
        maximum
    );

    setBar(
        "clookBar",
        "clookBarValue",
        data.clook.movement,
        maximum
    );


    // -----------------------------
    // Best algorithm
    // -----------------------------

    document.getElementById("bestAlgorithm")
        .textContent =
        "🏆 Minimum Head Movement: " +
        data.best_algorithm +
        " (" +
        Math.min(...values) +
        " cylinders)";


    // -----------------------------
    // Main timeline
    // -----------------------------

    drawMainTimeline(
        data.initial_head,
        data.requests,
        diskSize
    );
}


/* --------------------------------
   Create sequence text
-------------------------------- */

function createSequence(head, sequence) {

    return [head]
        .concat(sequence)
        .join(" → ");
}


/* --------------------------------
   Comparison bar
-------------------------------- */

function setBar(
    barId,
    valueId,
    value,
    maximum
) {

    const percentage =
        maximum === 0
        ? 0
        : (value / maximum) * 100;

    document.getElementById(barId)
        .style.width =
        percentage + "%";

    document.getElementById(valueId)
        .textContent =
        value + " cyl";
}


/* --------------------------------
   Mini visualization
-------------------------------- */

function drawMiniTimeline(
    elementId,
    head,
    sequence
) {

    const container =
        document.getElementById(elementId);

    container.innerHTML = "";


    const completeSequence =
        [head].concat(sequence);


    completeSequence.forEach(
        (position, index) => {

            const point =
                document.createElement("div");

            point.className =
                "mini-point";

            point.textContent =
                position;

            container.appendChild(point);

            if (index <
                completeSequence.length - 1) {

                const arrow =
                    document.createElement("span");

                arrow.textContent = "→";

                container.appendChild(arrow);
            }
        }
    );
}


/* --------------------------------
   Main cylinder timeline
-------------------------------- */

function drawMainTimeline(
    head,
    requests,
    diskSize
) {

    const timeline =
        document.getElementById("timeline");

    timeline.innerHTML = "";


    // Cylinder labels

    const labelCount = 10;

    for (let i = 0; i <= labelCount; i++) {

        const value =
            Math.round(
                (i / labelCount) *
                (diskSize - 1)
            );

        const percentage =
            (value / (diskSize - 1)) * 100;


        const label =
            document.createElement("div");

        label.className =
            "cylinder-label";

        label.style.left =
            percentage + "%";

        label.textContent =
            value;

        timeline.appendChild(label);
    }


    // Request points

    requests.forEach(position => {

        const percentage =
            (position / (diskSize - 1)) * 100;

        const point =
            document.createElement("div");

        point.className =
            "request-point";

        point.style.left =
            percentage + "%";

        point.title =
            "Cylinder " + position;

        timeline.appendChild(point);
    });


    // Initial head

    const headPercentage =
        (head / (diskSize - 1)) * 100;


    const headLabel =
        document.createElement("div");

    headLabel.className =
        "head-label";

    headLabel.style.left =
        headPercentage + "%";

    headLabel.textContent =
        "Initial Head: " + head;

    timeline.appendChild(headLabel);
}
