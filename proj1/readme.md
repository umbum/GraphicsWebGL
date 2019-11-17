
## 2014920026 엄성범 proj1
#### Requirements 모두 완료
- When the user left-clicks the canvas area, a star (colored in a random color) should be generated at the cursor position. 
- As time goes by, the star should rotate, shrink, and disappear (after around 3 seconds). 
- All the stars rotate in the same angular speed, 60 degrees/sec.  
- Draw the star as a “triangle fan”. 
- The vertex positions should NOT change. You should apply all the transformations (scaling, translating, and rotating) using uniform matrix variables. 
- To make implementation simpler, you can limit the number of stars currently rendered. (In the demo video, the maximum number of stars is 30.) 

#### Bonus points 모두 완료
- To draw all the stars, call a drawing function only once. (instance rendering) 
- Update the uniform variables all at once with only one function call. (uniform block)

#### 참고 사항
github URL : https://github.com/umbum/GraphicsWebGL  
- instance rendering 시 30개의 별을 모두 그리도록 명령하고 표시하지 않을 별은 화면 밖으로 이동시켜서 그리지 않도록 하는 방법을 사용하지 않고, 클릭한 별의 개수 만큼만 그리도록 작성했음.  
- 때문에 color를 uniform으로 처리함.

### gl.drawArraysInstanced(); 함수가 requestAnimationFrame이나 setInterval에 의해 주기적으로 호출될 때, 두 번째 호출 부터 인스턴스가 하나만 그려지는 현상
- Mac에서 발생하는 버그임을 확인.
- https://stackoverflow.com/questions/47972166/why-is-gl-drawarraysinstanced-unable-to-draw-more-than-one-shape-in-subsequent-c
- 같은 증상으로 올라온 글이 있으며, 위 링크의 code snippet을 실행해보면 맥(크롬)에서는 삼각형이 2개 그려졌다가, 1개가 사라지지만 윈도우(크롬)에서는 삼각형이 2개, 시간이 지나고 다시 drawArraysInstanced가 호출되어도 여전히 2개다.  
- **그렇기 때문에 맥 크롬에서 테스트 하시면 여러 번 클릭해도 별이 한 개만 보일 수 있습니다!**