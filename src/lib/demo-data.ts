export type Contact = { id: string; name: string; phone: string; avatar: string };
export type Account = { id: string; name: string; type: string; balance: number; color: string };
export type Loan = { id: string; contactId: string; principal: number; paidPrincipal: number; rate: number; chargesInterest: boolean; startDate: string; paymentDay: number; status: "Al día" | "Con atraso" | "Pagado" };
export type Payment = { id: string; loanId: string; amount: number; principal: number; interest: number; date: string; accountId: string };
export type Movement = { id: string; date: string; description: string; category: string; account: string; amount: number; kind: "Ingreso" | "Gasto" | "Movimiento" };
export type FinPalData = { contacts: Contact[]; accounts: Account[]; loans: Loan[]; payments: Payment[]; movements: Movement[] };

export const initialData: FinPalData = {
  contacts: [
    { id: "c1", name: "Carlos Mendoza", phone: "+591 71234567", avatar: "CM" },
    { id: "c2", name: "Ana Torres", phone: "+591 60876543", avatar: "AT" },
    { id: "c3", name: "Luis Pérez", phone: "+591 72223344", avatar: "LP" },
    { id: "c4", name: "María Gómez", phone: "+591 74556677", avatar: "MG" },
    { id: "c5", name: "Jorge Silva", phone: "+591 77788990", avatar: "JS" },
  ],
  accounts: [
    { id: "a1", name: "Efectivo", type: "Efectivo", balance: 1250, color: "mint" },
    { id: "a2", name: "Banco Nacional", type: "Cuenta bancaria · •••• 1234", balance: 8400, color: "blue" },
    { id: "a3", name: "Billetera móvil", type: "Billetera · +591 70000000", balance: 800, color: "coral" },
    { id: "a4", name: "Ahorros", type: "Cuenta de ahorro · •••• 5678", balance: 1000, color: "purple" },
  ],
  loans: [
    { id: "l1", contactId: "c1", principal: 3000, paidPrincipal: 650, rate: 3, chargesInterest: true, startDate: "2025-04-26", paymentDay: 26, status: "Al día" },
    { id: "l2", contactId: "c2", principal: 1500, paidPrincipal: 300, rate: 3, chargesInterest: true, startDate: "2025-04-28", paymentDay: 28, status: "Al día" },
    { id: "l3", contactId: "c3", principal: 4000, paidPrincipal: 900, rate: 3, chargesInterest: true, startDate: "2025-04-05", paymentDay: 5, status: "Con atraso" },
    { id: "l4", contactId: "c5", principal: 2500, paidPrincipal: 500, rate: 0, chargesInterest: false, startDate: "2025-05-10", paymentDay: 10, status: "Al día" },
  ],
  payments: [],
  movements: [
    { id: "m1", date: "26 may. 2025", description: "Pago de préstamo · Carlos Mendoza", category: "Préstamo", account: "Efectivo", amount: 600, kind: "Ingreso" },
    { id: "m2", date: "25 may. 2025", description: "Gasto · Supermercado", category: "Gasto", account: "Tarjeta / Débito", amount: -120, kind: "Gasto" },
    { id: "m3", date: "22 may. 2025", description: "Ingreso · Trabajo", category: "Ingreso", account: "Banco Nacional", amount: 1000, kind: "Ingreso" },
    { id: "m4", date: "20 may. 2025", description: "Pago de préstamo · Ana Torres", category: "Préstamo", account: "Efectivo", amount: 450, kind: "Ingreso" },
  ],
};

export const money = (value: number) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", minimumFractionDigits: 2 }).format(value).replace("BOB", "Bs");
export const contactFor = (data: FinPalData, id: string) => data.contacts.find((contact) => contact.id === id)?.name ?? "Sin persona";
export const loanBalance = (loan: Loan) => Math.max(0, loan.principal - loan.paidPrincipal);
export const monthlyInterest = (loan: Loan) => loan.chargesInterest ? loanBalance(loan) * loan.rate / 100 : 0;
