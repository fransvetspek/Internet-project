function showHint(str){
    if(str.length==0){
        document.getElementById("idveld").innerHTML = "";
        document.getElementById("idveld2").innerHTML = "";
        return;
    }        
    else{
        xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function(){
            if (this.readyState == 4 && this.status == 200){ 
                var table="<tr class='w3-red'><th>Titel</th><th>Artiest</th><th>Stemmen</th></tr>";
                if(JSON.parse(this.responseText).length == 0){
                    label="Je liedje heeft nog geen stemmen. Misschien een typefout? Of gewoon slechte smaak...";
                    document.getElementById("idveld2").innerHTML= label; 
                    document.getElementById("idveld").innerHTML = "";
                }
                else{
                    for(i=0;i<JSON.parse(this.responseText).length;i++){
                        table += "<tr><td>" +JSON.parse(this.responseText)[i].titel + "</td><td>" + JSON.parse(this.responseText)[i].artiestNaam +"</td><td>"+JSON.parse(this.responseText)[i].aantStemmen +"</td></tr>";
                    }
                    document.getElementById("idveld").innerHTML = table;
                    document.getElementById("idveld2").innerHTML = "";
                }
            }
        };
        xmlhttp.open("GET", "/liedje/zoek?q="+str, true);
        xmlhttp.send();
    }
};
