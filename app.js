const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasStatusAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

//Returns a list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

//API 2
//Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

//Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateTodoQuery = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
        updateTodoQuery = `
        UPDATE
            todo
        SET
            status = '${status}'
        WHERE
            id = ${todoId};
        `;
        await database.run(updateTodoQuery);
        response.send("Status Updated");
        break;

    case requestBody.priority !== undefined:
        updateTodoQuery = `
        UPDATE
            todo
        SET
            priority = '${priority}'
        WHERE
            id = ${todoId};
        `;
        await database.run(updateTodoQuery);
        response.send("Priority Updated");
        break;

    case requestBody.todo !== undefined:
        updateTodoQuery = `
        UPDATE
            todo
        SET
            todo = '${todo}'
        WHERE
            id = ${todoId};
        `;
        await database.run(updateTodoQuery);
        response.send("Todo Updated");
        break;
    
  }


//Delete a Todo based on Id
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
