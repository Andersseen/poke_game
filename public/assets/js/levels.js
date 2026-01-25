const btnFirstLevel = document.querySelector('#level_1');
const btnSecondLevel = document.querySelector('#level_2');
const btnThirdLevel = document.querySelector('#level_3');


//shuffle cards for arrays

const shuffleCards = (cards) => {
    let result;
    let totalMemoryCards = cards.concat(cards); //copy array

    //sort
    result = totalMemoryCards.sort(() => .5 - Math.random());

    return result

}

//make arrays
const doArrayFirstLevel = (array) => {
    let level = [];

    for (let i = 0; i < 2; i++) {
        level.push(array[i]);
    }

    return level;
}

const doArraySecondLevel = (array) => {
    let level = [];

    for (let i = 0; i < 4; i++) {
        level.push(array[i]);
    }

    return level;
}


const doArrayThirdLevel = (array) => {
    let level = [];

    for (let i = 0; i < 6; i++) {
        level.push(array[i]);
    }
    return level;
}




