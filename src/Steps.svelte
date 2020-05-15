<script>
    export let steps;
	
	function step(i = 0) {
		steps.children[i-1].scrollIntoView({ behavior: 'smooth', block: 'start' });
		//console.log(offset);
    }
    import Youtube from "@sveltecasts/svelte-youtube";
    let daisy = './images/daisy.png';
    let secondLayerStuck = "./images/second_layer_stuck.png";
    let secondLayer = "./images/second_layer.png";
    let whiteBottomLeft = "./images/white_bottom_left_corner.png";
    let whiteBottomRow = "./images/white_bottom_row_corner.png";
    let whiteCross = "./images/white_cross.png";
    let whiteTopCorner = "./images/white_top_corner.png";
    let whiteTopFaceCorner = "./images/white_top_face_corner.png";
    let yellowCrossComplete = "./images/yellow_cross_complete.png";
    let yellowCrossL = "./images/yellow_cross_l.png";
    let yellowCrossNoEdge = "./images/yellow_cross_no_edge.png";
    let yellowCrossStraightLine = "./images/yellow_cross_straight_line.png";
    let yellowFaceFish = "./images/yellow_face_fish.png";
    let yellowFaceNoFish = "./images/yellow_face_no_fish.png";
    let cornersNoMatching = "./images/corners_no_matching.png"
    let cornersMatching = "./images/corners_matching.png";
    let finalSolved = "./images/final_solved.png"
</script>

<main>
	<section
		class="left"
	>
		<ul>
            <li on:click="{() => step(1)}">01. Get to know your Rubik's Cube</li>
            <li on:click="{() => step(2)}">02. Make the Daisy</li>
            <li on:click="{() => step(3)}">03. Create the White Cross</li>
            <li on:click="{() => step(4)}">04. Solve the Bottom Layer</li>
            <li on:click="{() => step(5)}">05. Solve the Second Layer</li>
            <li on:click="{() => step(6)}">06. Create the Yellow Cross</li>
            <li on:click="{() => step(7)}">07. Solve the Yellow Face</li>
            <li on:click="{() => step(8)}">08. Position the Corners</li>
            <li on:click="{() => step(9)}">09. Position the Final Edges</li>
        </ul>
	</section>
	<section
		class="right"
	>
        <div class="steps">
	        <div class="track" bind:this="{steps}">
                <div class="step1">
                    <div
                        class="headerContainer1"
                    >
                        <div
                            class="number"
                        >
                            01
                        </div>
                        <div
                            class="text"
                        >
                            Get to know your Rubik's Cube
                        </div>
                    </div>
                    <div
                        class="middle1"
                    >
                        <Youtube videoId="R-R0KrXvWbc" />
                    </div>
                    <div
                        class="bottom1"
                    >
                        <p>This video provides a step-by-step tutorial for solving the Rubik's Cube. Also included is a basic understanding of the Rubik's Cube that will set you up nicely for this guide.</p>
                    </div>
                </div>
                <div class="step2">
                    <div
                        class="headerContainer"
                    >
                        <div
                            class="number"
                        >
                            02
                        </div>
                        <div
                            class="text"
                        >
                            Make the Daisy
                        </div>
                    </div>
                    <div
                        class="middle2"
                    >
                        <div
                            class="middle2text"
                        >
                            <p>For this step, simply do whatever you need to get the middle white square to be surrounded by 4 yellow stickers on each edge.</p>
                        </div>
                        <img src={daisy} alt="daisy goes here" >
                    </div>
                    <div
                        class="bottom2"
                    >
                    </div>
                </div>
                <div class="step3">
                    <div
                        class="headerContainer"
                    >
                        <div
                            class="number"
                        >
                            03
                        </div>
                        <div
                            class="text"
                        >
                            Create the White Cross
                        </div>
                    </div>
                    <div
                        class="middle2"
                    >
                        <div
                            class="middle2text"
                        >
                            <p>Align each white edge piece (on the top of the cube) so it’s adjacent color is matched to the color in the middle of each side.</p>
                            <p style="font-style: italic;">In this example above, on the right side red is already matched to the red in the middle of that side. However, on the left side, the orange is not – it’s matched to blue. </p>
                            <p style="padding-top: 10px;">If the colors are matched, turn the face of that side 2 times.</p>
                            <p>If the colors are not matched, rotate the top until they do match. When they match, turn that side 2 times.</p>
                            <p>Repeat this for each white edge piece</p>
                        </div>
                        <img src={whiteCross} alt="daisy goes here" >
                    </div>
                    <div
                        class="bottom2"
                    >
                            <p>If done correctly, you should have a white cross on the bottom and each white edges’ adjacent color will be matched properly to the middle color on each side</p>
                    </div>
                </div>
                <div class="step4">
                    <div
                        class="headerContainer"
                    >
                        <div
                            class="number"
                        >
                            04
                        </div>
                        <div
                            class="text"
                        >
                            Solve the Bottom Layer
                        </div>
                    </div>
                            <p>Start by flipping the cube over so that the yellow middle sticker is point up. You will keep the yellow sticker pointing up for the remainder of the solve.</p>
                    <div
                        class="middle4"
                    >
                        <div
                            class="middle4text"
                        >
                            <p style="text-decoration: underline"> WHITE STICKER(s) ON TOP ROW CORNER</p>
                            <p>First, look for white stickers on the top layer facing outward. When found, rotate the top row (if necessary) so that its right adjacent sticker is matched to the color of that side. </p>
                            <p>Perform the <span style="font-weight: bold">LEFT TRIGGER</span> move since the white/red sticker is to the top/left of the red middle sticker. </p>
                            <p>If the red sticker was to the top/right of red middle sticker, perform the <span style="font-weight: bold">RIGHT TRIGGER </span> move.</p>
                            <p>Repeat this for all the top row corner pieces</p>
                        </div>
                        <img src={whiteTopCorner} alt="top white goes here" >
                    </div>
                    <div
                        class="middle4"
                    >
                        <div
                            class="middle4text"
                        >
                            <p style="text-decoration: underline"> WHITE STICKER(s) ON THE TOP FACE CORNER</p>
                            <p>First, check to make that the white stick on top is directly above an empty white spot on the bottom of the cube. If it’s not, rotate the top row so that it is. </p>
                            <p>Once aligned above an empty white spot, perform either the  <span style="font-weight: bold">RIGHT or LEFT TRIGGER</span> move (depending on how you’re holding the cube) – just make sure your starting the trigger move on the side with the white sticker.</p>
                            <p>After you’ve done the trigger move twice. You should now have a white sticker on the top row on a side corner. With that in place, perform the steps when you have a white sticker on the top row on a side corner.</p>
                        </div>
                        <img src={whiteTopFaceCorner} alt="top white face goes here" >
                    </div>
                    <div
                        class="middle4"
                    >
                        <div
                            class="middle4text"
                        >
                            <p style="text-decoration: underline"> WHITE STICKER(s) ON BOTTOM ROW CORNER</p>
                            <p>If the white sticker is on a bottom right corner, perform the <span style="font-weight: bold"> RIGHT TRIGGER</span> </p>
                        </div>
                        <img src={whiteBottomRow} alt="white cross goes here" >
                    </div>
                    <div
                        class="middle4"
                    >
                        <div
                            class="middle4text"
                        >
                            <p>If the white sticker is on a bottom left corner, perform the <span style="font-weight: bold"> LEFT TRIGGER</span> </p>
                        </div>
                        <img src={whiteBottomLeft} alt="white cross goes here" >
                    </div>
                    <div
                        class="bottom4"
                    >
                            <p>After performing either one of the previous moves, there will now be a white sticker on the top face. As such, perform the step above for <span style="text-decoration: underline">WHITE STICKERS ON TOP FACE CORNER</span></p>
                    </div>
                </div>
                <div class="step5">
                    <div
                        class="headerContainer"
                    >
                        <div
                            class="number"
                        >
                            05
                        </div>
                        <div
                            class="text"
                        >
                            Solve the Second Layer
                        </div>
                    </div>
                        <p>At this point you should now have a completely white bottom and the first layer solved. For this step, you should be focusing on top row and the top face edge pieces. </p>
                    <div
                        class="middle5"
                    >
                        <div
                            class="middle5text"
                        >
                            <p>First, look for a top edge piece and its corresponding adjacent color that does NOT have a yellow sticker. For example, in the picture below, look for orange/green combo, green/red, or orange/blue.</p>
                            <p>When found, rotate the top row so that the top row middle face color matches to the color in the middle of the face.</p>
                            <!-- <p></p>
                            <p></p>
                            <p></p> -->
                        </div>
                        <img src={secondLayer} alt="white cross goes here" >
                    </div>
                    <div
                        class="middle5"
                    >
                        <div
                            class="middle5text"
                        >
                            <p>Next, look at the color of the sticker on the top face (in this example, orange). Since orange is the right face, you’ll first <span style="font-weight: bold">rotate the top row clockwise 1x</span> and then perform the<span style="font-weight: bold">RIGHT TRIGGER</span> move.</p>
                            <p>Then, perform the move when <span style="text-decoration: underline">WHITE STICKER ON TOP ROW CORNER</span></p>
                            <p style="font-style: italic">**Note: if the color of the sticker on the top face was on the left face, then you would rotate the top row counter-clockwise 1x and then perform the LEFT TRIGGER move </p>
                            <p>Continue to repeat until either A) All top row edge piece color combinations include a yellow sticker or B) the 2nd row is solved.</p>
                            <p>IF… A). all top row edge piece color combinations include a yellow sticker (see below), then you’ll need to perform either the <span style="font-weight: bold"> RIGHT TRIGGER or LEFT TRIGGER </span>on a side with a missing 2nd row piece. After you perform the trigger move, it should allow you perform the previous moves in this step to complete the 2nd row.</p>
                        </div>
                        <img src={secondLayerStuck} alt="white cross goes here" >
                    </div>
                    <div
                        class="bottom5"
                    >
                            <p></p>
                    </div>
                </div>
                <div class="step6">
                    <div
                        class="headerContainer"
                    >
                        <div
                            class="number"
                        >
                            06
                        </div>
                        <div
                            class="text"
                        >
                            Create the Yellow Cross
                        </div>
                    </div>
                        <p>When you get this step, you may have 1 of the following scenarios</p>
                    <div
                        class="middle6"
                    >
                        <div
                            class="middle6text"
                        >
                            <p style="text-decoration: underline">A) No Yellow edge pieces on top</p>
                            <p style="font-weight: bold"> F U R U’ R’ F’</p>
                            <p></p>
                            <p></p>
                        </div>
                        <img src={yellowCrossNoEdge} alt="yellow cross no edge goes here" >
                    </div>
                    <div
                        class="middle6"
                    >
                        <div
                            class="middle6text"
                        >
                            <p style="text-decoration: underline">B) Two yellow edges pieces that form a straight line</p>
                            <p>Turn the top row (if necessary) so that it forms a straight line - from your perspective. Then...</p>
                            <p style="font-weight: bold"> F U R U’ R’ F’</p>
                            <p></p>
                            <p></p>
                        </div>
                        <img src={yellowCrossStraightLine} alt="yellow cross straight goes here" >
                    </div>
                    <div
                        class="middle6"
                    >
                        <div
                            class="middle6text"
                        >
                            <p style="text-decoration: underline">C) Two edge pieces that form an L</p>
                            <p>Rotate the top row (if necessary) so that the edge pieces are at 12 and 9 - from your perspective</p>
                            <p style="font-weight: bold"> F U R U’ R’ F’</p>
                            <p></p>
                            <p></p>
                        </div>
                        <img src={yellowCrossL} alt="yellow cross L goes here" >
                    </div>
                    <p>** Continue to repeat until you have a yellow cross on top</p>
                    <div
                        class="middle6"
                    >
                        <div
                            class="middle6text"
                        >
                            <p></p>
                            <p></p>
                            <p></p>
                            <p></p>
                            <p></p>
                        </div>
                        <img src={yellowCrossComplete} alt="yellow cross complete goes here" >
                    </div>
                    <div
                        class="bottom6"
                    >
                            <p>Note… you may have extra yellow corner pieces (this is okay – repeat steps above until you have a yellow cross).</p>
                    </div>
                </div>
                <div class="step7">
                    <div
                        class="headerContainer"
                    >
                        <div
                            class="number"
                        >
                            07
                        </div>
                        <div
                            class="text"
                        >
                            Solve the Yellow Face
                        </div>
                    </div>
                    <p>Once you have a yellow cross, inspect the top face.</p>
                    <div
                        class="middle7"
                    >
                        <div
                            class="middle7text"
                        >
                            <p style="text-decoration: underline">Fish Pattern</p>
                            <p>If there are three empty corners on the top face, it will look like a “fish” pattern. If you have the fish pattern, rotate the top so that the mouth is down and to the left. </p>
                            <p>Then, perform this algorithm</p>
                            <p style="font-weight: bold"> R U R' U R U2 R'</p>
                        </div>
                        <img src={yellowFaceFish} alt="yellow face goes here" >
                    </div>
                    <div
                        class="middle7"
                    >
                        <div
                            class="middle7text"
                        >
                            <p style="text-decoration: underline">No Fish Pattern</p>
                            <p>If you have zero or two yellow corner stickers, rotate the top of the cube so that you have a yellow sticker in the upper right corner of the left face. </p>
                            <p>Then, perform this algorithm</p>
                            <p style="font-weight: bold"> R U R' U R U2 R'</p>
                        </div>
                        <img src={yellowFaceNoFish} alt="yellow no fish face goes here" >
                    </div>
                    <div
                        class="bottom7"
                    >
                            <p>Note: You may need to repeat the “fish” pattern 2x</p>
                    </div>
                </div>
                <div class="step8">
                    <div
                        class="headerContainer"
                    >
                        <div
                            class="number"
                        >
                            08
                        </div>
                        <div
                            class="text"
                        >
                            Position the Corners
                        </div>
                    </div>
                    <p>At this point, you should have a fully completed top yellow face. Now, the goal of this step is to have one side with matching top corner stickers. </p>
                    <div
                        class="middle8"
                    >
                        <div
                            class="middle8text"
                        >
                            <p>If there are no matching top corner pieces...</p>
                            <p>Perform this algorithm</p>
                            <p style="font-weight: bold"> L’ U R U’ L U R’ R U R’ U R U2 R’</p>
                            <p></p>
                        </div>
                        <img src={cornersNoMatching} alt="corner positions goes here" >
                    </div>
                    <div
                        class="middle8"
                    >
                        <div
                            class="middle8text"
                        >
                            <p>If there is a side that has matching corner colors, rotate the top layer so that it is aligned with the corresponding face and position it so that face is in your left hand. </p>
                            <p>Then, perform the same algorithm</p>
                            <p style="font-weight: bold"> L’ U R U’ L U R’ R U R’ U R U2 R’</p>
                            <p></p>
                        </div>
                        <img src={cornersMatching} alt="corner positions goes here" >
                    </div>
                    <div
                        class="bottom8"
                    >
                            <p></p>
                    </div>
                </div>
                <div class="step9">
                    <div
                        class="headerContainer"
                    >
                        <div
                            class="number"
                        >
                            09
                        </div>
                        <div
                            class="text"
                        >
                            Position the Final Edges
                        </div>
                    </div>
                    <div
                        class="middle9"
                    >
                        <div
                            class="middle9text"
                        >
                            <p>If one of the sides is completely solved, face that side away and perform the appropriate pattern:</p>
                            <br/>
                            <p style="text-decoration: underline">Swap top middle edges in clockerwise manner:</p>
                            <p style="font-weight: bold">F2 U R’ L F2 L’ R U F2</p>
                            <br/>
                            <p style="text-decoration: underline">Swap top middle edges in counter-clockwise manner:</p>
                            <p style="font-weight: bold">F2 U’ R’ L F2 L’ R U’ F2</p>
                            <br/>
                            <p>If none of the sides are solved, perform the counter clockwise algorithm once, reposition and then perform the appropriate clockwise or counter-clockwise algorithm.</p>
                        </div>
                    </div>
                    <div
                        class="bottom9"
                    >
                        <img src={finalSolved} alt="final positions goes here" >
                            <p>Congratulations! You just solved the Rubik’s Cube!</p>
                    </div>
                </div>
	        </div>
        </div>
	</section>
</main>


<style>

    main {
		text-align: center;
		padding: 1em;
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: row;
	}
	.left {
        width: 340px;
        margin-top: 100px;
	}

	.right {
        width: 100%;
        /* margin-top: 100px; */
        margin-left: 45px;
        margin-right: 45px;
    }
    
    .track {
        margin-left: 28px;
    }

    img {
        margin-bottom: 50px;
        margin-top: 25px;
    }

    ul {
        list-style: none;
        font-family: 'Helvetica Neue';
        text-align: left;
        margin-top: 50px;
        padding-left: 0;
        position: fixed;
        border-spacing: 0;
        /* cursor: pointer !important; */
    }
    li {
        list-style: none;                
        font-family: 'Helvetica Neue';
        margin-bottom: 35px;
        cursor: pointer !important;
        border-spacing: 0;
    }

    li:hover {
        /* font-weight: bold; */
        color: #E1494A
    }

    .headerContainer1{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-top: 130px;
    }
    .headerContainer{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-top: 107px;
    }

    .number {
        font-size: 60px;
        font-family: 'Helvetica Neue';
        color: lightgrey;
        font-size: 76px;
        color: lightgrey;
        font-weight: bolder;
    }

    .text {
        margin-left: 37px;
        margin-bottom: 20px;
        margin-top: -37px;
        position: relative;
        font-size: 40px;
        font-weight: normal;
    }

    .step1 {
        min-height: 250px;
        font-family: 'Helvetica Neue';
        display: flex;
        flex-direction: column;
    }
    .middle1 {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }
    .bottom1 {
        padding-top: 25px;
        margin-bottom: 25px;
    }
    .step2 {
        min-height: 250px;
        font-family: 'Helvetica Neue';
        display: flex;
        flex-direction: column;
    }
    
    .middle2 {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
    .middle2text {
        max-width: 58%;
        text-align: justify;
    }
    .bottom2 {
        margin-bottom: 25px;
    }
    .step3 {
        min-height: 250px;
        font-family: 'Helvetica Neue';
        display: flex;
        flex-direction: column;

    }
    .middle3 {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
    .middle3text {
        max-width: 58%;
        text-align: justify;
    }
    .bottom3 {
        margin-bottom: 25px;
    }
    .step4 {
        min-height: 250px;
        font-family: 'Helvetica Neue';
        display: flex;
        flex-direction: column;

    }
    .middle4 {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
    .middle4text {
        max-width: 58%;
        text-align: justify;
    }
    .bottom4 {
        margin-bottom: 25px;
    }
    .step5 {
        min-height: 250px;
        font-family: 'Helvetica Neue';
        display: flex;
        flex-direction: column;
        
    }
    .middle5 {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
    .middle5text {
        max-width: 58%;
        text-align: justify;
    }
    .bottom5 {
        margin-bottom: 25px;
    }
    .step6 {
        min-height: 250px;
        font-family: 'Helvetica Neue';
        display: flex;
        flex-direction: column;
    }
    .middle6 {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
    .middle6text {
        max-width: 58%;
        text-align: justify;
    }
    .bottom6 {
        margin-bottom: 25px;
    }
    .step7 {
        min-height: 250px;
        font-family: 'Helvetica Neue';
        display: flex;
        flex-direction: column;
    }
    .middle7{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
    .middle7text {
        max-width: 58%;
        text-align: justify;
    }
    .bottom7 {
        margin-bottom: 25px;
    }
    .step8 {
        min-height: 250px;
        font-family: 'Helvetica Neue';
        display: flex;
        flex-direction: column;
    }
    .middle8 {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
    .middle8text {
        max-width: 58%;
        text-align: justify;
    }
    .bottom8 {
        margin-bottom: 25px;
    }
    .step9 {
        min-height: 250px;
        font-family: 'Helvetica Neue';
        display: flex;
        flex-direction: column;
    }
    .middle9 {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
    .middle9text {
        /* max-width: 58%; */
        text-align: justify;
    }
    .bottom9 {
        margin-bottom: 25px;
    }
</style>

