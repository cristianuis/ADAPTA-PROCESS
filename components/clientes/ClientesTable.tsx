import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Database } from "@/lib/supabase/types";

type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export function ClientesTable({ clientes }: { clientes: Cliente[] }) {
  if (clientes.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No hay clientes todavía.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Razón social</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>Contacto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell className="font-medium">
                <Link href={`/clientes/${cliente.id}`} className="hover:underline">
                  {cliente.razon_social}
                </Link>
              </TableCell>
              <TableCell>{cliente.sector ?? "—"}</TableCell>
              <TableCell>{cliente.ciudad ?? "—"}</TableCell>
              <TableCell>{cliente.contacto_nombre ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
