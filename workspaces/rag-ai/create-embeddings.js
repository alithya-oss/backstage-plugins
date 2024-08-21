var url = 'http://localhost:7007/api/rag-ai/embeddings/catalog';
var token = process.env.EXTERNAL_CALLER_AUTH_KEY;
var entities = ['Component', 'API', 'Resource'];

for (var i = 0; i < entities.length; i++) {
  var options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json; charset=utf-8',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({
      entityFilter: {
        kind: entities[i],
      },
    }),
  };

  console.log(url, options);

  fetch(url, options)
    .then(function (res) {
      return res.json();
    })
    .then(function (jsonData) {
      console.log(jsonData);
      console.log(jsonData.status);
    });
}
