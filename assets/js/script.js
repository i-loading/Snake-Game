function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
const video = document.querySelector(".background");

const longWrapper = document.querySelector(".long_link");
const dynamicWrapper = document.querySelector(".dynamic_link");
const longVideo = document.querySelector(".video_long");
const dynamicVideo = document.querySelector(".video_dynamic");
const bgVideo = document.querySelector(".background");

const longMusic = new Audio("assets/audio/long.mp3");
const dynamicMusic = new Audio("assets/audio/dynamic.mp3");
const hoverMusic = new Audio("assets/audio/hover.wav");
hoverMusic.volume = 0.1;
longMusic.volume = dynamicMusic.volume = 0.05;
longMusic.loop = dynamicMusic.loop = true;

longWrapper.addEventListener("mouseover", () => {
  longVideo.play();
  hoverMusic.play();
  setTimeout(() => {
    longMusic.play();
  }, 500);
});
longWrapper.addEventListener("mouseleave", () => {
  longVideo.pause();
  longMusic.pause();
  setTimeout(() => {
    longMusic.pause();
  }, 500);
});
dynamicWrapper.addEventListener("mouseover", () => {
  dynamicVideo.play();
  hoverMusic.play();
  setTimeout(() => {
    dynamicMusic.play();
  }, 500);
});
dynamicWrapper.addEventListener("mouseleave", () => {
  dynamicVideo.pause();
  dynamicMusic.pause();
  setTimeout(() => {
    dynamicMusic.pause();
  }, 500);
});

window.onload = function () {
  document.querySelector(".preloader").classList.add("preloader-none");
  if (randomIntFromInterval(1, 2) === 2)
    video.src = video.src.replace("bg.mp4", "bg2.mp4");

  setTimeout(() => {
    document.querySelector(".preloader").style.display = "none";
  }, 3800);
};