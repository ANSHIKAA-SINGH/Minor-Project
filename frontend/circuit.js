const components = document.querySelectorAll('.component');
const canvas = document.getElementById('canvas');
let selectedComponent = null;
let wires = [];

components.forEach((component) => {
  component.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData(
      'componentType',
      component.getAttribute('data-type')
    );
  });
});

canvas.addEventListener('dragover', (e) => e.preventDefault());

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData('componentType');
  if (!type) return;

  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;

  createComponent(type, x, y);
});

function createComponent(type, x, y) {
  const component = document.createElement('div');
  component.classList.add('draggable');
  component.setAttribute('data-type', type);
  component.style.left = `${x}px`;
  component.style.top = `${y}px`;

  component.innerHTML = `${type} <span class="delete-btn">x</span>`;

  // ✅ Add Input for Resistor and Capacitor
  if (type === 'Resistor' || type === 'Capacitor') {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = type === 'Resistor' ? 100 : 10; // Default: 100Ω for Resistor, 10µF for Capacitor
    input.classList.add('value-input');
    input.addEventListener('input', () => {
      component.setAttribute('data-value', input.value);
    });

    component.appendChild(input);
    component.setAttribute('data-value', input.value);
  }

  enableDragging(component);
  canvas.appendChild(component);

  component.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    removeComponent(component);
  });

  component.addEventListener('click', () => handleComponentClick(component));
}

function toggleDiodeDirection(component) {
  const currentDirection = component.getAttribute('data-direction');

  if (currentDirection === 'forward') {
    component.setAttribute('data-direction', 'reverse');
    component.style.transform = 'rotate(180deg)';
  } else {
    component.setAttribute('data-direction', 'forward');
    component.style.transform = 'rotate(0deg)';
  }

  updateWires(); // Ensure wires adjust properly
}

function enableDragging(component) {
  let offsetX, offsetY;

  component.addEventListener('mousedown', (e) => {
    offsetX = e.clientX - component.offsetLeft;
    offsetY = e.clientY - component.offsetTop;

    function onMouseMove(e) {
      component.style.left = `${e.clientX - offsetX}px`;
      component.style.top = `${e.clientY - offsetY}px`;
      updateWires();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', onMouseMove);
    });
  });
}

function handleComponentClick(component) {
  if (selectedComponent) {
    if (selectedComponent !== component) {
      createWire(selectedComponent, component);
    }
    selectedComponent = null;
  } else {
    selectedComponent = component;
  }
}

function createWire(start, end) {
  if (start === end) return;

  const wire = document.createElement('div');
  wire.classList.add('wire');
  canvas.appendChild(wire);

  // ✅ Save start and end for bi-directional checking
  wires.push({ wire, start, end });
  updateWires();
}

function updateWires() {
  wires.forEach(({ wire, start, end }) => {
    const startX = start.offsetLeft + start.offsetWidth / 2;
    const startY = start.offsetTop + start.offsetHeight / 2;
    const endX = end.offsetLeft + end.offsetWidth / 2;
    const endY = end.offsetTop + end.offsetHeight / 2;

    const length = Math.hypot(endX - startX, endY - startY);
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

    wire.style.width = `${length}px`;
    wire.style.transform = `rotate(${angle}deg)`;
    wire.style.left = `${startX}px`;
    wire.style.top = `${startY}px`;
  });
}

function removeComponent(component) {
  wires = wires.filter(({ wire, start, end }) => {
    if (start === component || end === component) {
      wire.remove();
      return false;
    }
    return true;
  });

  component.remove();
}

// ✅ Simulation Logic
const startSimulationButton = document.getElementById('start-simulation');
const stopSimulationButton = document.getElementById('stop-simulation');

startSimulationButton.addEventListener('click', () => {
  simulateCircuit();
});

stopSimulationButton.addEventListener('click', () => {
  document
    .querySelectorAll('.active')
    .forEach((el) => el.classList.remove('active'));
});
//simulate circuit
function simulateCircuit() {
  let poweredComponents = new Set();
  let totalResistance = 0;

  document
    .querySelectorAll('.draggable[data-type="Power"]')
    .forEach((power) => {
      traceConnections(power, poweredComponents);
    });

  // ✅ Calculate total resistance
  document
    .querySelectorAll('.draggable[data-type="Resistor"]')
    .forEach((resistor) => {
      let resistance = parseFloat(resistor.getAttribute('data-value')) || 100;
      totalResistance += resistance;
    });

  let totalVoltage = 5; // Assume 5V power
  let current = totalVoltage / (totalResistance || 1); // Ohm’s Law: I = V/R

  document.querySelectorAll('.draggable[data-type="LED"]').forEach((led) => {
    if (poweredComponents.has(led)) {
      let brightness = Math.min(1, current / 0.01); // Normalize brightness
      led.style.opacity = brightness; // Adjust LED brightness
      led.classList.add('active');
    } else {
      led.classList.remove('active');
    }
  });
}

function simulateCapacitors() {
  document
    .querySelectorAll('.draggable[data-type="Capacitor"]')
    .forEach((capacitor) => {
      let capacitance = parseFloat(capacitor.getAttribute('data-value')) || 10;
      let voltage = capacitance * 0.01; // Q = CV

      if (voltage > 0.5) {
        capacitor.classList.add('charging'); // Indicate charge
      } else {
        capacitor.classList.remove('charging'); // Indicate discharge
      }

      setTimeout(() => {
        capacitor.classList.remove('charging');
      }, capacitance * 10); // Simulate slow discharge
    });
}

function traceConnections(component, poweredComponents, previous = null) {
  if (poweredComponents.has(component)) return;
  poweredComponents.add(component);

  wires.forEach(({ start, end }) => {
    if (start === component && end !== previous) {
      if (canPassCurrent(start, end)) {
        traceConnections(end, poweredComponents, start);
      }
    }

    if (end === component && start !== previous) {
      if (canPassCurrent(end, start)) {
        traceConnections(start, poweredComponents, end);
      }
    }
  });
}

// ✅ Check if current can pass through a component
function canPassCurrent(from, to) {
  if (to.getAttribute('data-type') === 'Diode') {
    const direction = to.getAttribute('data-direction');

    // ✅ Allow reverse flow through diode
    if (direction === 'forward' && from.offsetLeft <= to.offsetLeft)
      return true;
    if (direction === 'reverse' && from.offsetLeft >= to.offsetLeft)
      return true;

    return false;
  }

  if (to.getAttribute('data-type') === 'Switch') {
    return to.classList.contains('active');
  }

  return true;
}
