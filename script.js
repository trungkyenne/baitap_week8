/**
 * Modern Clean Calculator
 * Handles core arithmetic, chained calculations, robust input sanitization,
 * safe floating point formatting, and physical keyboard support without eval().
 */
class Calculator {
  constructor(previousOperandElement, currentOperandElement) {
    this.previousOperandElement = previousOperandElement;
    this.currentOperandElement = currentOperandElement;
    this.clear();
  }

  /**
   * Resets calculator state to defaults
   */
  clear() {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.operation = undefined;
    this.shouldResetScreen = false;
    this.isError = false;
  }

  /**
   * Deletes the last entered digit or character
   */
  delete() {
    if (this.isError) {
      this.clear();
      return;
    }
    if (this.shouldResetScreen) {
      this.currentOperand = '0';
      this.shouldResetScreen = false;
      return;
    }
    if (this.currentOperand === '0') return;

    if (
      this.currentOperand.length === 1 ||
      (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))
    ) {
      this.currentOperand = '0';
    } else {
      this.currentOperand = this.currentOperand.slice(0, -1);
    }
  }

  /**
   * Appends a number or digit to current operand
   * @param {string} number 
   */
  appendNumber(number) {
    if (this.isError) this.clear();

    if (this.shouldResetScreen) {
      this.currentOperand = '';
      this.shouldResetScreen = false;
    }

    // Prevent excessive digit overflow
    if (this.currentOperand.replace(/[-.]/g, '').length >= 16) {
      return;
    }

    if (this.currentOperand === '0' && number !== '.') {
      this.currentOperand = number;
    } else {
      this.currentOperand += number;
    }
  }

  /**
   * Appends decimal point ensuring only one exists
   */
  appendDecimal() {
    if (this.isError) this.clear();

    if (this.shouldResetScreen) {
      this.currentOperand = '0';
      this.shouldResetScreen = false;
    }

    if (this.currentOperand.includes('.')) return;
    this.currentOperand += '.';
  }

  /**
   * Toggles positive / negative sign
   */
  toggleSign() {
    if (this.isError || this.currentOperand === '0') return;

    if (this.currentOperand.startsWith('-')) {
      this.currentOperand = this.currentOperand.slice(1);
    } else {
      this.currentOperand = '-' + this.currentOperand;
    }
  }

  /**
   * Calculates percentage of the current operand
   */
  applyPercentage() {
    if (this.isError) return;

    const current = parseFloat(this.currentOperand);
    if (isNaN(current)) return;

    // If an operation is queued with a previous operand (e.g. 200 + 10%),
    // calculate 10% of 200 = 20
    if (this.operation && this.previousOperand !== '') {
      const prev = parseFloat(this.previousOperand);
      if (!isNaN(prev)) {
        const percentVal = (prev * current) / 100;
        this.currentOperand = this.formatNumber(percentVal);
        return;
      }
    }

    // Otherwise calculate simple percentage (value / 100)
    const result = current / 100;
    this.currentOperand = this.formatNumber(result);
  }

  /**
   * Chooses an arithmetic operator (+, −, ×, ÷)
   * Supports continuous chained calculations
   * @param {string} operation 
   */
  chooseOperation(operation) {
    if (this.isError) this.clear();

    // If operator was pressed right after another operator, just switch the operation
    if (this.shouldResetScreen && this.operation) {
      this.operation = operation;
      return;
    }

    if (this.previousOperand !== '') {
      this.compute();
    }

    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.shouldResetScreen = true;
  }

  /**
   * Safely calculates the arithmetic expression without using eval()
   */
  compute() {
    let computation;
    const prev = parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);

    if (isNaN(prev) || isNaN(current)) return;

    switch (this.operation) {
      case '+':
        computation = prev + current;
        break;
      case '−':
      case '-':
        computation = prev - current;
        break;
      case '×':
      case '*':
        computation = prev * current;
        break;
      case '÷':
      case '/':
        if (current === 0) {
          this.currentOperand = "Cannot divide by 0";
          this.previousOperand = '';
          this.operation = undefined;
          this.isError = true;
          this.shouldResetScreen = true;
          return;
        }
        computation = prev / current;
        break;
      default:
        return;
    }

    this.currentOperand = this.formatNumber(computation);
    this.operation = undefined;
    this.previousOperand = '';
    this.shouldResetScreen = true;
  }

  /**
   * Formats numbers to avoid floating point anomalies (0.1 + 0.2 = 0.30000000000000004)
   * and formats extreme values cleanly
   * @param {number} num 
   * @returns {string}
   */
  formatNumber(num) {
    if (!isFinite(num)) {
      this.isError = true;
      return "Error";
    }

    // Resolve IEEE-754 precision issues by rounding to 12 decimal places
    let rounded = parseFloat(num.toPrecision(12));

    // Handle large or very small numbers using scientific notation
    if (Math.abs(rounded) >= 1e14 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-6)) {
      return rounded.toExponential(6).replace(/\+/, '');
    }

    return rounded.toString();
  }

  /**
   * Formats number string with locale thousands separators for display
   * @param {string} numberStr 
   * @returns {string}
   */
  getDisplayNumber(numberStr) {
    if (this.isError) return numberStr;
    if (numberStr.includes('e')) return numberStr;

    const parts = numberStr.split('.');
    const integerPart = parseFloat(parts[0]);
    const decimalPart = parts[1];

    let integerDisplay = '';
    if (isNaN(integerPart)) {
      integerDisplay = parts[0] === '-' ? '-' : '';
    } else {
      integerDisplay = integerPart.toLocaleString('en-US');
    }

    if (decimalPart != null) {
      return `${integerDisplay}.${decimalPart}`;
    } else {
      return integerDisplay;
    }
  }

  /**
   * Updates display elements and styles on screen
   */
  updateDisplay() {
    if (this.isError) {
      this.currentOperandElement.innerText = this.currentOperand;
      this.currentOperandElement.classList.add('error');
      this.previousOperandElement.innerText = '';
      return;
    }

    this.currentOperandElement.classList.remove('error');
    const displayVal = this.getDisplayNumber(this.currentOperand);
    this.currentOperandElement.innerText = displayVal;

    // Dynamically reduce font size if string is long to avoid overflow
    if (displayVal.length > 10) {
      this.currentOperandElement.classList.add('shrink');
    } else {
      this.currentOperandElement.classList.remove('shrink');
    }

    if (this.operation != null) {
      this.previousOperandElement.innerText = `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
    } else {
      this.previousOperandElement.innerText = '';
    }

    // Highlight active operator button
    document.querySelectorAll('.btn-operator').forEach((button) => {
      if (this.operation && button.getAttribute('data-operator') === this.operation) {
        button.classList.add('is-active-op');
      } else {
        button.classList.remove('is-active-op');
      }
    });
  }
}

/* -------------------------------------------------------------
   Initialization & Event Listeners
------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const previousOperandElement = document.getElementById('previousOperand');
  const currentOperandElement = document.getElementById('currentOperand');

  const calculator = new Calculator(previousOperandElement, currentOperandElement);

  // Button clicks handling
  document.querySelectorAll('.btn').forEach((button) => {
    button.addEventListener('click', () => {
      const number = button.getAttribute('data-number');
      const operator = button.getAttribute('data-operator');
      const action = button.getAttribute('data-action');

      if (number !== null) {
        calculator.appendNumber(number);
      } else if (operator !== null) {
        calculator.chooseOperation(operator);
      } else if (action !== null) {
        handleAction(action, calculator);
      }

      calculator.updateDisplay();
    });
  });

  /**
   * Action handler helper
   */
  function handleAction(action, calc) {
    switch (action) {
      case 'clear':
        calc.clear();
        break;
      case 'delete':
        calc.delete();
        break;
      case 'decimal':
        calc.appendDecimal();
        break;
      case 'equals':
        calc.compute();
        break;
      case 'percent':
        calc.applyPercentage();
        break;
      case 'toggle-sign':
        calc.toggleSign();
        break;
    }
  }

  /**
   * Visual button click ripple / press effect for keyboard navigation
   */
  function triggerButtonEffect(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.classList.add('active-key');
      setTimeout(() => btn.classList.remove('active-key'), 120);
    }
  }

  // Physical Keyboard Support
  window.addEventListener('keydown', (e) => {
    const key = e.key;

    // Digits 0 - 9
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      calculator.appendNumber(key);
      triggerButtonEffect(`[data-number="${key}"]`);
    }
    // Decimal point
    else if (key === '.' || key === ',') {
      e.preventDefault();
      calculator.appendDecimal();
      triggerButtonEffect('[data-action="decimal"]');
    }
    // Operators
    else if (key === '+') {
      e.preventDefault();
      calculator.chooseOperation('+');
      triggerButtonEffect('[data-operator="+"]');
    } else if (key === '-') {
      e.preventDefault();
      calculator.chooseOperation('−');
      triggerButtonEffect('[data-operator="−"]');
    } else if (key === '*' || key.toLowerCase() === 'x') {
      e.preventDefault();
      calculator.chooseOperation('×');
      triggerButtonEffect('[data-operator="×"]');
    } else if (key === '/') {
      e.preventDefault();
      calculator.chooseOperation('÷');
      triggerButtonEffect('[data-operator="÷"]');
    }
    // Equals / Calculate
    else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculator.compute();
      triggerButtonEffect('#btnEquals');
    }
    // Delete / Backspace
    else if (key === 'Backspace') {
      e.preventDefault();
      calculator.delete();
      triggerButtonEffect('#btnDelete');
    }
    // Clear / Escape
    else if (key === 'Escape') {
      e.preventDefault();
      calculator.clear();
      triggerButtonEffect('#btnClear');
    }
    // Percentage
    else if (key === '%') {
      e.preventDefault();
      calculator.applyPercentage();
      triggerButtonEffect('#btnPercent');
    }

    calculator.updateDisplay();
  });

  // Initial display render
  calculator.updateDisplay();
});

