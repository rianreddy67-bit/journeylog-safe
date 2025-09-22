import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, DollarSign, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

const categories = [
  { value: "transport", label: "🚗 Transport", color: "bg-blue-100 text-blue-800" },
  { value: "food", label: "🍽️ Food", color: "bg-green-100 text-green-800" },
  { value: "accommodation", label: "🏨 Stay", color: "bg-purple-100 text-purple-800" },
  { value: "activities", label: "🎯 Activities", color: "bg-orange-100 text-orange-800" },
  { value: "shopping", label: "🛍️ Shopping", color: "bg-pink-100 text-pink-800" },
  { value: "other", label: "📝 Other", color: "bg-gray-100 text-gray-800" }
];

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(25000);
  const { toast } = useToast();

  // Load expenses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tourSafeExpenses');
    if (saved) {
      setExpenses(JSON.parse(saved));
    }
  }, []);

  // Save expenses to localStorage
  useEffect(() => {
    localStorage.setItem('tourSafeExpenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = () => {
    if (!amount || !category || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      category,
      description,
      date: new Date().toLocaleDateString()
    };

    setExpenses(prev => [newExpense, ...prev]);
    setAmount("");
    setCategory("");
    setDescription("");
    
    toast({
      title: "💰 Expense Added",
      description: `₹${amount} added to ${category}`,
    });
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    toast({
      title: "🗑️ Expense Deleted",
      description: "Expense removed from tracker",
    });
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = budget - totalSpent;
  const budgetPercentage = (totalSpent / budget) * 100;

  const getCategoryData = (categoryValue: string) => {
    return categories.find(cat => cat.value === categoryValue) || categories[categories.length - 1];
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-2xl font-bold text-primary">₹{totalSpent.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(remaining).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget Progress</span>
              <span>{budgetPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${budgetPercentage > 100 ? 'bg-red-500' : budgetPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {remaining >= 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Under budget</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-red-600">Over budget</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Expense */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Add Expense
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Amount (₹)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Description (e.g., Taxi to hotel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={addExpense} className="w-full" variant="gradient">
            Add Expense
          </Button>
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No expenses tracked yet</p>
              <p className="text-sm">Add your first expense above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 10).map((expense) => {
                const categoryData = getCategoryData(expense.category);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={categoryData.color}>
                          {categoryData.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{expense.date}</span>
                      </div>
                      <p className="font-medium">{expense.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">₹{expense.amount}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}