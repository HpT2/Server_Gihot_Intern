resumeTime = 3;
function update()
{   
    //console.log(Math.round(resumeTime) - resumeTime);
    if(Math.abs(resumeTime - Math.round(resumeTime)) < 0.01) console.log(Math.round(resumeTime));
    resumeTime = resumeTime - 0.02;
}

setInterval(() => update(), 20);