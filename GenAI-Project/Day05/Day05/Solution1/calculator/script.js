const display = document.querySelector('.calculator-display');
const buttons = document.querySelectorAll('.button');

let currentInput = '0';
let operator = null;
let previousInput = '';
let resetDisplay = false;

buttons.forEach(button => {
    button.addEventListener('click', (e) => {
        const value = e.target.innerText;

        if (e.target.classList.contains('number')) {
            if (resetDisplay) {
                currentInput = value;
                resetDisplay = false;
            } else {
                currentInput = currentInput === '0' ? value : currentInput + value;
            }
            display.value = currentInput;
        } else if (e.target.classList.contains('operator')) {
            if (operator && !resetDisplay) {
                calculate();
            }
            operator = value;
            previousInput = currentInput;
            resetDisplay = true;
        } else if (e.target.classList.contains('equal')) {
            calculate();
            operator = null;
            resetDisplay = true;
        } else if (e.target.classList.contains('clear')) {
            currentInput = '0';
            operator = null;
            previousInput = '';
            resetDisplay = false;
            display.value = currentInput;
        } else if (e.target.classList.contains('backspace')) {
            currentInput = currentInput.slice(0, -1);
            if (currentInput === '') {
                currentInput = '0';
            }
            display.value = currentInput;
        } else if (e.target.classList.contains('decimal')) {
            if (resetDisplay) {
                currentInput = '0.';
                resetDisplay = false;
            } else if (!currentInput.includes('.')) {
                currentInput += '.';
            }
            display.value = currentInput;
        }
    });
});

function calculate() {
    let result;
    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);

    if (isNaN(prev) || isNaN(current)) return;

    switch (operator) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*' :
            result = prev * current;
            break;
        case '/':
            result = prev / current;
            break;
        default:
            return;
    }
    currentInput = result.toString();
    display.value = currentInput;
}
