Download from server latest metadata to see the new 'podcasts' table and when you query:

query Podcasts {
  podcasts(limit: 5000, order_by: {created_at: desc}) {
    id
    podcast_name
    url
    title
    description
    date
    transcription_md
    created_at
    user {
      id
      username
    }
  }
}

You get:

{
  "data": {
    "podcasts": [
      {
        "id": "728a8c40-fa2b-466b-8c86-d61ff83bbc84",
        "podcast_name": "Algorütm",
        "url": "https://episodes.captivate.fm/episode/e69665f3-64c5-4045-9440-c2efe126fa15.mp3",
        "title": "Kuidas AI ajastul tudengeid programmeerima õpetada",
        "description": "Seekord on külas Andres Käver, arhitekt ja TalTech lektor ning Karl Rudolf Õigus, TalTech õppeassistent ja 3. kursuse tudeng, kelle käest kuuleme, kuidas AI abil tudengite õpetamine TalTechis käib, kas AI kasutamist ka õpetatakse ja kuidas tudengid neid vahendeid kasutavad.  -----  Jaga meile enda jaoks olulisimat mõtet episoodist meie Discord kanalis: https://discord.gg/8X5JTkDxcc  Episoodi veavad Priit Liivak ja Erik Jõgi  Algorütmi toetavad  LHV https://www.lhv.ee/  Nortal https://nortal.com/  Codeborne https://codeborne.com/",
        "date": "2026-03-26",
        "transcription_md": "# Algorütm — Episood 389: IT Haridus ja Tehisintellekt  **Saatejuht:** Riit Liivak   **Külalised:** Karl Rudolf Õigus *(Talteki 3. kursuse tudeng ja õppeassistent)* · Andres Käver *(arhitekt ja Talteki lektor)*    ---  ## Sissejuhatus  Eelmises episoodis rääkisime Marko Rilloga IT hariduse omandamisest ja sellest, mis väärtust see täna loob, kui AI väga võimekalt koodi kirjutab. Täna vaatame seda asja õpisülikooli poolalt: kuidas õpetamine koos AI-ga käib ja kas AI-d ka õpetatakse.  ---  ## Andrese taust  Andres on sündinud 1974 ja sattus IT valdkonda üsna juuslikult — õppis Tartus matemaatikat aastal ~1991, mil IT Eestis veel sisuliselt puudus. Iseseisvusega koos tuli suur IT-laine ning Andres oli sobiva taustaga, et sellele lainele surfilauaga ette jõuda.  Järgnes mitmekülgne karjäär: - Kinexi ettevõttes süsteemiosakonna juhatajana (raamatupidamise juurutamine, nt Viisnurk) - Tele-mängude ja graafika tootmine (Eesti Loto süsteem, valimistulemused, telesaadete live-graafika) - Vabakutseline lektor Taltekis viimased ~15 aastat - Doktoriõpe Tanel Alumäe juhendamisel, fookusega AI-l  **Õpetamise maht:** ~600–700 deklaratsiooni õppeaastas, ~200–400 unikaalset tudengit. Õpetab reedeti hommikust õhtuni, kaks ainet semestris.  ---  ## Karli taust  Karl on Talteki 3. kursuse tudeng ning õppeassistent. Alustas õpinguid ajal, mil AI revolutsioon etc.",
        "created_at": "2026-04-07T08:15:03.198968+00:00",
        "user": {
          "id": "3dd76df3-322a-481f-b7a6-67adf68e7b08",
          "username": "kaspar"
        }
      }
    ]
  }
}

That query is also accessible for anybody in the internet without auth from REST GET and POST at https://api.todzz.eu/api/rest/podcasts

Now the same way create in Hasura mutation to insert podcasts and read podcasts. Note user permissions. 

At /routes/podcasts in the top add button "Add / transcribe podcast" (note multilingual)" and ability to enter podcast's fields like title, description, date picker, url, and the name of the podcast. When user is logged in then we will enter also user_id.

When user is not logged in the user_id will be empty and the Groc API key must be entered. If user is logged in and no Groc api key then ask to go to Settings.

Below all the podcasts. List and possible to open / download nicely displayed MD formatted.