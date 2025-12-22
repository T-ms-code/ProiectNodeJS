const {app,port} = require("./app");


app.listen(port, (error) =>{
    if(error){
        console.error(error);
    }
    console.log(`App listening on port ${port}`);
});