<script>
    let src = './images/rubik_gif.gif';
    export let page = 'Home'
    function setPage(i) {
		page = i
	} 
</script>

<div
    class="NavBar"
>
    <div
        class="TitleContainer"
    >
        <img {src} alt="rubik gif">
        <div
            class="Title"
        >
            <h4>Guide:</h4>
            <h1>How to Solve a Rubik's Cube</h1>
        </div>
    </div>
    <div
        class="NavLinks"
    >
        <li on:click="{() => setPage('Home')}">Home</li>
        <li on:click="{() => setPage('Timer')}">Timer</li>
        <li>Purchase Cube</li>
    </div>
</div>


<style>
    .NavBar {
        height: 125px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        font-family: 'Helvetica Neue';
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 10000;
        background-color: white;
        margin-top: -8px;
    }
    .NavLinks {
        /* height: 400px; */
        display: flex;
        flex-direction: row;
        margin-right: 50px;
        margin-top: 25px;
        font-family: 'Helvetica Neue';
        font-size: 16px;
        margin-bottom: 80px;
    }
    .TitleContainer {
        display: flex;
        flex-direction: row;
    }
    .Title {
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-top: 18px;
    }

    h1 {
        margin: 0;
        font-size: 28px;
        font-family: 'Helvetica Neue';

    }

    h4 {
        margin: 0;
        font-weight: normal;
        font-family: 'Helvetica Neue';

    }

    li {
        list-style-type: none;
        padding-right: 12px;
        margin-left: 25px;
        font-family: 'Helvetica Neue';
        cursor: pointer;
    }

    li:hover{
        color: #E1494A
    }

    img {
        height: 200px;
        margin-left: -50px;
        margin-top: -25px;
        margin-right: -50px;
    }

</style>

