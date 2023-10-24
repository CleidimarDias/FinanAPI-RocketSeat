const express = require('express');
const { v4: uuidv4 } = require('uuid')


const app = express();

const customers = [];

app.use(express.json())

const verifyIfAlreadyExistsAccountCpf = (request, response, next) => {
    const { cpf } = request.params;
    const customer = customers.find((customer) => customer.cpf === cpf);
    if (!customer) {
        return response.status(402).json({ error: "Customer not found" })
    }
    request.customer = customer;
    return next();
}

const getBalance = (statement) => {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "credit") {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0)

    return balance;
}

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement []
 */

app.post("/account", (request, response) => {
    const { cpf, name } = request.body;
    const custumersAlreadyExists = customers.some((customer) => customer.cpf === cpf);
    if (custumersAlreadyExists) {
        return response.status(400).json({ error: "Customer already exists!" });
    }
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    })
    return response.status(201).send();
});

app.put("/account/:cpf", verifyIfAlreadyExistsAccountCpf, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;
    response.status(201).send();
})

app.get("/statement/:cpf", verifyIfAlreadyExistsAccountCpf, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
});

app.get("/statement/:cpf/date", verifyIfAlreadyExistsAccountCpf, (request, response) => {
    const { date } = request.query;
    const { customer } = request;

    const dateFormat = new Date(date + "00:00");

    const statement = customer.statement.find((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());
})

app.post("/deposit/:cpf", verifyIfAlreadyExistsAccountCpf, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statmantOperation = {
        description,
        amount,
        type: "credit",
        created_at: new Date(),
    }

    customer.statement.push(statmantOperation);

    return response.status(201).send();
})

app.post("/saque/:cpf", verifyIfAlreadyExistsAccountCpf, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;
    const balanço = getBalance(customer.statement);
    if (balanço < amount) {
        return response.status(400).json({ error: "Saldo Insuficiente" })
    }
    const statementOperation = {
        amount,
        type: "debit",
        created_at: new Date(),
    }
    customer.statement.push(statementOperation);
    response.status(201).send();
});

app.get("/show", (request, response) => {

    return response.json(customers);
});

app.delete("/account/:cpf", verifyIfAlreadyExistsAccountCpf, (request, response) => {
    const { customer } = request;
    customers.splice(customer, 1);
    return response.status(200).json(customer);
});

app.get("/balance/:cpf", verifyIfAlreadyExistsAccountCpf, (request, response) => {
    const { customer } = request;
    const balance = getBalance(customer.statement);

    return response.json(balance);
})

app.listen(3333);

