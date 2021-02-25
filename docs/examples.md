# Learn by examples
This file is a good place to learn vnatk by examples

We are giving you axios examples as the main purpose of this framework is to work with vnatk-vue. But in any case, you should focus on postData and pay attenstion to comments in each example
## Basic example

```javascript
var postData = {
    model: "SaleOrder",
    create: false, // you can skip these false set, but setting this will clear your received data from unwanted things.
    update: false, // all those extra informations are for vnatk-vue framework
    delete: false,
    actions: false, // this must be set to false, as by default vnatk adds id field for various actions.
    read: {
        modeloptions: {
            where: { // where name like '%'+ name_var + '%' or createdAt > given value
                $or: {
                    name :{
                        $like: '%'+ name_var + '%'
                    },
                    createdAt: {
                        $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // last 30 days
                        .toJSON()
                        .slice(0, 10), // in mysql yyyy-mm-dd format
                    }
                },
            },
        },
    },
};

axios_instance.post("{BASE_PATH}/crud", postData).then((response) => {
    // returns data from SaleOrder model with default scope applied if any
    console.log(response.data.data);
});


```


## Using aggregate functions

```javascript

var postData = {
    model: "SaleOrder",
    create: false,
    update: false,
    delete: false,
    actions: false, // this must be set to false, as by default vnatk adds id field for various actions.
    read: {
        modeloptions: {
        attributes: [
            // converts to sequelize.fn, sequelize.col at the framework backend
            { fn: "DATE", col: "createdAt", as: "Date" },
            { fn: "sum", col: "netAmount", as: "Sales" },
        ],
        where: {
            createdAt: {
            $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // last 30 days
                .toJSON()
                .slice(0, 10), // in mysql yyyy-mm-dd format
            },
        },
        group: [{ fn: "DATE", col: "createdAt" }],
        },
    },
};

axios_instance.post("{BASE_PATH}/crud", postData).then((response) => {
    console.log(response.data.data);
});


```