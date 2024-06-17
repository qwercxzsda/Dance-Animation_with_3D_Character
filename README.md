# Dance Animation with 3D Character

## Overview

[Mixamo](https://www.mixamo.com/#/)에서 다운받은 모델과 음악을 업로드하면 모델이 음악 박자에 따라 춤을 춘다.

## How to Run

Clone the git repository.

```bash
git clone https://github.com/qwercxzsda/Dance-Animation_with_3D_Character.git
```

Install the required packages.

```bash
cd Dance-Animation_with_3D_Character/dance-animation-with-3d-character
npm install
```

Run the server.

```bash
npm run dev
```

That's it! Open your browser and go to `http://localhost:5173`.

Or, you can build the project and run the server.

```bash
npm run build
npm run preview
```

You are also free to use the devcontainer if you wish. Devcontainer settings are in the file
`.devcontainer/devcontainer.json`.

## How to Use

### UI

<img width="1483" alt="image" src="https://github.com/qwercxzsda/cs434-project/assets/101696461/e1b0fad6-720b-4ced-b370-a607923f2e06">

`Import Model` : Click this button to import a 3D model. There are example models in the `public` folder. The model must be a single `.glb` (or `.gltf`) file. See below
for the requirements for the model.

`Import Song` : Click this button to import a song. The song must be a `.mp3` file.

`BPM` : The BPM of the current song. BPM is used to synchronize the dance animation with the song.

`Play` : Click this button to play the dance animation and the song.

`Pause` : Click this button to pause the dance animation and the song.

`Stop` : Click this button to stop the dance animation and the song.

`Start Recording` : Click this button to start recording the canvas. Everything you see on the canvas, including the
song, is recorded. Maximum length of the recording (currently 60) is defined by  `recordingTimeOut`, located in
`src/config.js`. Feel free to change this value.

`Timer (0 sec / 60 sec)` : How long the current recording is.

`Stop Recording / Download` : Click this button to stop recording and download the recording as a `.webm` file.

### Model Requirements

All the models from Mixamo are a `.fbx` file. However, Babylon does not support this file type.

There are two workarounds I found, both not recommendable. The first workaround is the [
babylonjs-fbx-loader](https://www.npmjs.com/package/babylonjs-fbx-loader). This package is not maintained, and does not
work. The second workaround is [fbx2gltf](https://www.npmjs.com/package/fbx2gltf). This package is for server-side
conversion, and I could not make it work on the browser.

As a result, even though I tried my best, this project only supports a single file `.glb` (or `.gltf`) model. To be
fair, the official Babylon documentation also recommends converting the `.fbx` file to `.glb` file by hand, using
Blender ([link](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Mixamo_to_Babylon)).

In summary, to use models from Mixamo, follow the below steps.

1. Download the model from Mixamo. Select FBX Binary.
2. Import the model to Blender.
3. Export the model as a `.glb` file. Do not include animations.
4. Upload the converted `.glb` file.

If these steps aren't feasible, you can use the example models in the `public` folder.

## Design

### Animation

Mixamo의 여러 모델들을 관찰한 결과, Spine, Head, LeftArm, LeftForeArm, RightArm, RightForeArm, LeftLeg, RightLeg의 `bone`을 공통적으로 가지고
있음을 발견했다. 또한 위의 `bone`들을 적당히 `rotate`하면 (`translate`하면 이상하게 변한다) 춤과 같은 동작이 됨을 확이했다.

따라서 위에서 나열된 `bone`들을 랜덤하게 `rotate`하는 `animation`들을 만들고 이 `animation`들을 `animationGroup`으로 묶었다.

`animationGroup`을 계산할 때 `keyFrame`이 초당 한 개씩 존재하도록 설정했다. 따라서 `animationGroup.speedratio`를 `bpm / 60`으로 설정하면
`animationGroup`은 `bpm`에 맞춰 동작한다.

### Challenges

#### docker로 실행되는 서버 접속 문제

[link](https://github.com/vitejs/vite/issues/16522)에서 볼 수 있듯 Docker의 문제이다. ip를 지정하거나 `--host`를 사용하면 해결된다. 하지만
`javascript`와 `vite`가 익숙하지 않아서 문제 원인을 찾는데 시간이 걸렸다.

#### 모델 파일 확장자 문제

Babylon이 `.fbx`파일을 지원하지 않는 문제이다. Model Requirements에 적혀있듯 많은 방법을 시도했으나 해결하지 못했다.

#### 모델을 어떻게 움직이는가?

Mixamo의 모델마다 `bone`이 조금씩 다르다. 따라서 사용자가 업로드한 임의의 모델을 어떻게 움직일지 고민했다. 다양한 모델을 관찰해 공통되는 `bone`을 찾아서 해결했다.

#### `bone`이 움직이지 않음

[link](https://forum.babylonjs.com/t/set-bone-position-wont-work/20050)에서 볼 수 있듯 `bone`이 `transformNode`에 붙어있어서 `bone`을
직접 조작할 수 없어 생기는 문제이다. `bone`대신 `transformNode`를 조작해서 해결했다.
