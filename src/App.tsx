import { useEffect, useState } from "react";
import "./App.css";

type Operator = "+" | "-" | "×" | "÷" | null;

function App() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState("");

  const formatNumber = (value: number) => {
    if (!Number.isFinite(value)) {
      return "Error";
    }

    const rounded = Number(value.toFixed(10));

    return rounded.toLocaleString("en-US", {
      maximumFractionDigits: 10,
    });
  };

  const parseDisplay = () => {
    return Number(display.replace(/,/g, ""));
  };

  const calculate = (
    firstValue: number,
    secondValue: number,
    currentOperator: Operator
  ) => {
    switch (currentOperator) {
      case "+":
        return firstValue + secondValue;

      case "-":
        return firstValue - secondValue;

      case "×":
        return firstValue * secondValue;

      case "÷":
        if (secondValue === 0) {
          return NaN;
        }
        return firstValue / secondValue;

      default:
        return secondValue;
    }
  };

  const inputNumber = (number: string) => {
    if (display === "Error") {
      setDisplay(number);
      setExpression("");
      return;
    }

    if (waitingForOperand) {
      setDisplay(number);
      setWaitingForOperand(false);
      return;
    }

    if (display === "0") {
      setDisplay(number);
      return;
    }

    if (display.replace(/,/g, "").length >= 12) {
      return;
    }

    setDisplay(display + number);
  };

  const inputDecimal = () => {
    if (display === "Error") {
      setDisplay("0.");
      setExpression("");
      return;
    }

    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }

    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clearCalculator = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression("");
  };

  const toggleSign = () => {
    if (display === "0" || display === "Error") {
      return;
    }

    if (display.startsWith("-")) {
      setDisplay(display.substring(1));
    } else {
      setDisplay("-" + display);
    }
  };

  const percentage = () => {
    const value = parseDisplay();

    if (Number.isNaN(value)) {
      return;
    }

    setDisplay(formatNumber(value / 100));
  };

  const chooseOperator = (nextOperator: Operator) => {
    const inputValue = parseDisplay();

    if (Number.isNaN(inputValue)) {
      return;
    }

    if (operator && previousValue !== null && !waitingForOperand) {
      const result = calculate(previousValue, inputValue, operator);

      if (!Number.isFinite(result)) {
        setDisplay("Error");
        setPreviousValue(null);
        setOperator(null);
        setExpression("");
        return;
      }

      const formattedResult = formatNumber(result);

      setDisplay(formattedResult);
      setPreviousValue(result);
      setExpression(`${formattedResult} ${nextOperator}`);
    } else {
      setPreviousValue(inputValue);
      setExpression(`${display} ${nextOperator}`);
    }

    setOperator(nextOperator);
    setWaitingForOperand(true);
  };

  const equals = () => {
    if (operator === null || previousValue === null) {
      return;
    }

    const currentValue = parseDisplay();

    if (Number.isNaN(currentValue)) {
      return;
    }

    const result = calculate(previousValue, currentValue, operator);

    if (!Number.isFinite(result)) {
      setDisplay("Error");
      setPreviousValue(null);
      setOperator(null);
      setExpression("Cannot divide by zero");
      setWaitingForOperand(true);
      return;
    }

    const resultText = formatNumber(result);

    setExpression(`${formatNumber(previousValue)} ${operator} ${display} =`);
    setDisplay(resultText);
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const key = event.key;

      if (key >= "0" && key <= "9") {
        inputNumber(key);
      } else if (key === ".") {
        inputDecimal();
      } else if (key === "+") {
        chooseOperator("+");
      } else if (key === "-") {
        chooseOperator("-");
      } else if (key === "*") {
        chooseOperator("×");
      } else if (key === "/") {
        event.preventDefault();
        chooseOperator("÷");
      } else if (key === "%") {
        percentage();
      } else if (key === "Enter" || key === "=") {
        equals();
      } else if (key === "Escape" || key.toLowerCase() === "c") {
        clearCalculator();
      } else if (key === "Backspace") {
        if (
          display !== "0" &&
          display !== "Error" &&
          !waitingForOperand
        ) {
          const newValue = display.slice(0, -1);
          setDisplay(newValue || "0");
        }
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  });

  return (
    <main className="calculator-page">
      <div className="background-decoration decoration-one"></div>
      <div className="background-decoration decoration-two"></div>

      <section className="calculator-container">
        <div className="calculator-header">
          <div>
            <span className="small-label">REACT PROJECT</span>
            <h1>Smart Calculator</h1>
          </div>

          <div className="react-badge">⚛</div>
        </div>

        <div className="calculator">
          <div className="display">
            <div className="expression">
              {expression || "Ready"}
            </div>

            <div className="display-number">
              {display}
            </div>
          </div>

          <div className="buttons">
            <button
              className="button button-function clear"
              onClick={clearCalculator}
            >
              AC
            </button>

            <button
              className="button button-function"
              onClick={toggleSign}
            >
              +/−
            </button>

            <button
              className="button button-function"
              onClick={percentage}
            >
              %
            </button>

            <button
              className="button button-operator"
              onClick={() => chooseOperator("÷")}
            >
              ÷
            </button>

            <button
              className="button button-number"
              onClick={() => inputNumber("7")}
            >
              7
            </button>

            <button
              className="button button-number"
              onClick={() => inputNumber("8")}
            >
              8
            </button>

            <button
              className="button button-number"
              onClick={() => inputNumber("9")}
            >
              9
            </button>

            <button
              className="button button-operator"
              onClick={() => chooseOperator("×")}
            >
              ×
            </button>

            <button
              className="button button-number"
              onClick={() => inputNumber("4")}
            >
              4
            </button>

            <button
              className="button button-number"
              onClick={() => inputNumber("5")}
            >
              5
            </button>

            <button
              className="button button-number"
              onClick={() => inputNumber("6")}
            >
              6
            </button>

            <button
              className="button button-operator"
              onClick={() => chooseOperator("-")}
            >
              −
            </button>

            <button
              className="button button-number"
              onClick={() => inputNumber("1")}
            >
              1
            </button>

            <button
              className="button button-number"
              onClick={() => inputNumber("2")}
            >
              2
            </button>

            <button
              className="button button-number"
              onClick={() => inputNumber("3")}
            >
              3
            </button>

            <button
              className="button button-operator"
              onClick={() => chooseOperator("+")}
            >
              +
            </button>

            <button
              className="button button-number zero"
              onClick={() => inputNumber("0")}
            >
              0
            </button>

            <button
              className="button button-number"
              onClick={inputDecimal}
            >
              .
            </button>

            <button
              className="button button-operator equals"
              onClick={equals}
            >
              =
            </button>
          </div>
        </div>

        <div className="keyboard-hint">
          <span>⌨</span>
          You can also use your keyboard
        </div>
      </section>
    </main>
  );
}

export default App;