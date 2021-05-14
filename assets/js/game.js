const btnStart = document.querySelector('.btn');
const table = document.querySelector('#table');





const onClickStartGame = () => {
    table.classList.toggle('close');
}





btnStart.addEventListener('click', onClickStartGame);