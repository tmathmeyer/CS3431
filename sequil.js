var pg = require('pg');
var client = new pg.Client(conString);

exports.init = function(server){
	var client = new pg.Client("postgres://postgres:password@localhost:5432/crypto");
	client.connect(function(){

		server.get("query/names", function(req, response){
			response.writeHead(200, {"Content-Type": "text/json"});
			client.query('SELECT fname, lname FROM account', function(err, result){
				if (err){
					response.end("error querying database");
				} else {
					response.end(JSON.stringify(result.rows.map(function(each){
						return each.fname+" "+each.lname;
					})));
				}
			});
		});

		server.get("query/transaction/_var", function(r, response, c, currencyName){
			response.writeHead(200, {"Content-Type": "text/json"});
			client.query("SELECT transactionid FROM transaction WHERE currency='"+currencyName+"'", function(err, result){
				if (err){
					response.end("error querying database");
				} else {
					response.end(JSON.stringify(result.rows.map(function(each){
						return each.transactionid;
					})));
				}
			});
		});

		server.get("query/transaction_count/_var", function(r, response, c, id){
			response.writeHead(200, {"Content-Type": "text/json"});
			client.query("SELECT COUNT(transactionid) FROM transaction WHERE (toact="+id+") OR (fromact="+id+")", function(err, result){
				if (err){
					response.end("error querying database");
				} else {
					response.end(JSON.stringify(result.rows[0]));
				}
			});
		});

		server.get("query/coinvals/_var", function(r, response, c, coin){
			response.writeHead(200, {"Content-Type": "text/json"});
			client.query("SELECT SUM(amount) FROM balance WHERE currency='"+coin+"'", function(err, result){
				if (err){
					response.end("error querying database");
				} else {
					response.end(JSON.stringify(result.rows[0]));
				}
			});
		});

		server.get("query/accountvalue/_var", function(r, response, c, id){
			response.writeHead(200, {"Content-Type": "text/json"});
			client.query("SELECT amount, value_stsh as val FROM balance b JOIN currency c ON c.abbreviation=b.currency WHERE account_id="+id, function(err, result){
				if (err){
					response.end("error querying database");
				} else {
					response.end("value: "+
						result.rows.map(function(each){
							return each.val * each.amount
						}).concat([0]).reduce(function(a, b){
							return a+b;
						}) + " satoshi"
					);
				}
			});
		});

		server.get("query/verify/_var", function(r, response, c, id){
			response.writeHead(200, {"Content-Type": "text/plain"});
			client.query("SELECT * FROM balance WHERE account_id="+id, function(err, balances){
				if (err) {
					response.end(JSON.stringify(err));
				} else {
					if (balances.rows.length == 0){
						response.end("no data");
					}
					balances.rows.forEach(function(each, n){
						client.query("SELECT SUM(amount) FROM transaction WHERE toact="+id+" AND currency='"+each.currency+"'", function(err, res){
							if (err) {
								response.end(JSON.stringify(err));
							} else {
								each.amount -= res.rows[0].sum;
								
								client.query("SELECT SUM(amount) FROM transaction WHERE toact="+id+" AND currency='"+each.currency+"'", function(err, res){
									console.log(res.rows[0].sum);
									each.amount += parseInt(res.rows[0].sum);
									each.offby = each.amount;
									delete each.amount;
									response.write(JSON.stringify(each)+"\n");
									if (n == balances.rows.length-1)
									{
										response.end("");
									} else {
										console.log("not done on: "+n+" of "+balances.rows.length);

									}
								});
							}
						});
					});
				}
			});
		});
	});
}
