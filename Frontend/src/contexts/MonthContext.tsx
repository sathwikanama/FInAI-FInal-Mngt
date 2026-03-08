import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react";
import transactionService from "../services/transaction.service";

interface MonthContextType {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  categoryTotals: { [key: string]: number };
}

const MonthContext = createContext<MonthContextType | undefined>(undefined);

export const useMonth = (): MonthContextType => {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error("useMonth must be used within a MonthProvider");
  }
  return context;
};

export const MonthProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const today = new Date();

  // ✅ Use 1-based month to match MySQL
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return (
      Number(localStorage.getItem("selectedMonth")) ||
      today.getMonth() + 1
    );
  });

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return (
      Number(localStorage.getItem("selectedYear")) ||
      today.getFullYear()
    );
  });

  const [categoryTotals, setCategoryTotals] = useState<{
    [key: string]: number;
  }>({});

  // ✅ Persist month/year when changed
  useEffect(() => {
    localStorage.setItem("selectedMonth", String(selectedMonth));
    localStorage.setItem("selectedYear", String(selectedYear));
  }, [selectedMonth, selectedYear]);

  // ✅ Fetch category totals whenever month/year changes
  useEffect(() => {
    const fetchAndCalculate = async () => {
      try {
        const params = new URLSearchParams();
params.set("page", "1");
params.set("limit", "100000"); // large enough to get all
params.set("month", selectedMonth.toString());
params.set("year", selectedYear.toString());

        const response: any = await transactionService.getTransactions(
          `?${params.toString()}`
        );
console.log("MonthContext API response:", response);
        const transactions =
  response?.data || [];
console.log("Transactions received in MonthContext:", transactions);
        const totals: { [key: string]: number } = {};

        transactions.forEach((t: any) => {
  if (t.type?.toLowerCase() === "expense") {
            const key = t.category.toLowerCase();
            totals[key] =
              (totals[key] || 0) + Number(t.amount);
          }
        });
console.log("Calculated category totals:", totals);
        setCategoryTotals(totals);
      } catch (error) {
        console.error("MonthContext calculation error:", error);
      }
    };

    fetchAndCalculate();
  }, [selectedMonth, selectedYear]);

  return (
    <MonthContext.Provider
      value={{
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        categoryTotals
      }}
    >
      {children}
    </MonthContext.Provider>
  );
};

export default MonthContext;