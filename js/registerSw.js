if(navigator.serviceWorker){
    navigator.serviceWorker.register('/sw.js').then(function(reg){
        console.log('Yay');
    }).catch(function(err){
        console.log('Boo!');
    });
}