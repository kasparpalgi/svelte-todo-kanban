At /routes/penon let's display my cabin's temperature Celsius, humidity % and soil humidity. By default display past 24h and time consider if winder/summer in Gran Canaria.

Let user to go 24h back/forth & display nice graph. 

Here's the example query to get data:

query Penon($where: penon_bool_exp = {}, $order_by: [penon_order_by!] = {timestamp: desc}, $limit: Int = 5000, $offset: Int = 0) {
  penon(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    id
    temp
    humidity
    soil
    timestamp
  }
}


Result:

{
  "data": {
    "penon": [
      {
        "id": "17b94d2c-03c5-46a7-9416-145fab4636db",
        "temp": 21,
        "humidity": 78.5,
        "soil": 3663,
        "timestamp": "2026-01-31T09:29:28.661303+00:00"
      },
      {
        "id": "cb076c46-a7c7-4701-907d-04f086c27579",
        "temp": 21.1,
        "humidity": 78.4,
        "soil": 3674,
        "timestamp": "2026-01-31T09:14:24.841653+00:00"
      },
      {
        "id": "58165165-8824-474b-9639-aa25dad71622",
        "temp": 20.9,
        "humidity": 80.6,
        "soil": 3664,
        "timestamp": "2026-01-31T08:59:21.448291+00:00"
      },
      {
        "id": "042223b8-b496-425c-a886-5bdca2cbcd2a",
        "temp": 21,
        "humidity": 84.4,
        "soil": 3667,
        "timestamp": "2026-01-31T08:44:17.657379+00:00"
      },
      {
        "id": "05f23b95-8660-48fb-9111-11e32eb9c569",
        "temp": 20.7,
        "humidity": 85.1,
        "soil": 3662,
        "timestamp": "2026-01-31T08:29:13.611609+00:00"
      },
      //etc.

      I have already started:
      
      1. In lib/graphql/documents.ts I have added at the end:

export const Penon = graphql(`
  query Penon($where: penon_bool_exp = {}, $order_by: [penon_order_by!] = {timestamp: desc}, $limit: Int = 5000, $offset: Int = 0) {
    penon(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      temp
      humidity
      soil
      timestamp
    }
  }
`);

export const InsertPenon = graphql(`
  mutation InsertPenon($objects: [penon_insert_input!]!) {
    insert_penon(objects: $objects) {
      affected_rows
    }
  }
`);

2. I have also installed: npm i d3-shape d3-scale layercake

3. Then I have created three files (see them) in src/lib/components/charts folder.

Now I created empty test route at /src/routes/penon/+page.svelte that visitors can see without login. Create there the charts.

Do it only in English (no multilang needed.)