import bcrypt from "bcrypt";
import postgres from "postgres";
import { invoices, customers, revenue, users } from "../lib/placeholder-data";

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: "require",
  prepare: false,
});

async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const usersWithHashedPasswords = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return { ...user, password: hashedPassword };
    })
  );

  return sql`
        INSERT INTO users ${sql(
          usersWithHashedPasswords,
          "id",
          "name",
          "email",
          "password"
        )}
    ON CONFLICT (id) DO NOTHING;
      `;
}

async function seedInvoices() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  return sql`
    INSERT INTO invoices ${sql(
      invoices,
      "customer_id",
      "amount",
      "status",
      "date"
    )}
    ON CONFLICT (id) DO NOTHING;
  `;
}

async function seedCustomers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  return sql`
    INSERT INTO customers ${sql(customers, "id", "name", "email", "image_url")}
    ON CONFLICT (id) DO NOTHING;
  `;
}

async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  return sql`
    INSERT INTO revenue ${sql(revenue, "month", "revenue")}
    ON CONFLICT (month) DO NOTHING;
  `;
}

export async function GET() {
  try {
    const result = await Promise.all([
      seedUsers(),
      seedCustomers(),
      seedInvoices(),
      seedRevenue(),
    ]);

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
