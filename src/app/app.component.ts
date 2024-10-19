import { utf8Encode } from '@angular/compiler/src/util';
import { Component, OnInit } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HubConnection } from '@microsoft/signalr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  implements OnInit {
 
  private audioChunks: any;
private hubConnection!: HubConnection;
private mediaRecorder!: any;
  title = 'Angular 13 CRUD example';

  constructor(){
  }

  ngOnInit(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:7014/SpeechHub')
    .configureLogging(signalR.LogLevel.Information)
    .build();

    this.hubConnection.start()
    .then(() => console.log('SignalR connection started over HTTPS!'))
    .catch(err => console.error('Error while starting SignalR connection:', err));

    this.hubConnection.start()
      .then(() => {
        console.log('Connection started');
        this.startListeningForMessages();
      })
      .catch(err => console.error('Error while starting connection:', err));

    this.hubConnection.on('ReceiveMessage', (message: string) => {
      console.log('Recognized text:', message);
    });

  //   this.checkPermissions()
  //  this.createLocalStream();
  }
  startListeningForMessages(): void {
    this.hubConnection.on('ReceiveMessage', (message: string) => {
      this.audioChunks = message;
      console.log('Received recognized text:', this.audioChunks);
    });
  }


  stream: any;
  enableVideo = true;
  enableAudio = true;


  async createLocalStream() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted:', stream);
  
        const audioElement = document.createElement('audio');
        audioElement.srcObject = stream;  
        audioElement.controls = true;    
        document.body.appendChild(audioElement);
  
        // await audioElement.play(); 

        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start(1000); 

        this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
          const audioBlob = event.data;
          this.sendAudioToSignalR(audioBlob); 
        };
  
        console.log('Playing audio from microphone stream...');
      } catch (error:any) {
        console.error('Error accessing microphone:', error);
        alert(`Can't join room, error: ${error.message}`);
      }
    } else {
      console.log('Media devices API not supported by the browser.');
      alert('Media devices API not supported by the browser.');
    }
  }

  stopRecording()
  {
this.mediaRecorder.onstop = () => {
          console.log('Recording stopped');
        };
  }


  async checkPermissions() {
    const navigatorWithPermissions = navigator as any;
  
    if (navigatorWithPermissions.permissions) {
      try {
        const permission = await navigatorWithPermissions.permissions.query({ name: 'microphone' });
        console.log('Microphone permission state:', permission.state);
        if (permission.state !== 'granted') {
          alert('Microphone access is not granted!');
        }
      } catch (error) {
        console.error('Error querying permissions:', error);
      }
    } else {
      console.log('Permissions API is not supported in this browser.');
      alert('Permissions API is not supported in this browser.');
    }
  }

  // sendAudioToSignalR(audioBlob: Blob): void {
  //   const reader = new FileReader();
  //   // debugger
  //   const file = new File([audioBlob], 'audio.wav', {
  //     type: 'audio/wav', 
  //   });
  //   const formData = new FormData();
  //   formData.append('data', file, file.name);
  //   // const reader = new FileReader();
  //   // console.log('formdata',file,file.name);
  //   // 
  //   this.hubConnection.invoke('SendAudioStream', formData,)
  //   .then(() => console.log('Audio chunk sent'))
  //   .catch(err => console.error('Error sending audio:', err));
  //   // reader.onload = () => {
  //   //   // const audioBuffer = reader.result as ArrayBuffer;
  //   //   const ArrayBuffer = reader.result as ArrayBuffer;
  //   //   const bytesArray = new Uint8Array (ArrayBuffer);

  //   //   this.hubConnection.invoke('SendMessage', bytesArray)
  //   // .then(() => console.log('Audio chunk sent'))
  //   // .catch(err => console.error('Error sending audio:', err));
  //   // };
  //   // reader.readAsArrayBuffer(audioBlob); 
  // }

  sendAudioToSignalR(audioBlob: Blob): void {
    const reader = new FileReader();
    reader.onload = () => {
        const audioArrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(audioArrayBuffer);

        const base64String = btoa(String.fromCharCode(...Array.from(uint8Array)));
        
        this.hubConnection.invoke('SendAudioStream', base64String)
            .then(() => console.log('Audio chunk sent'))
            .catch(err => console.error('Error sending audio:', err));
    };
    reader.readAsArrayBuffer(audioBlob);
   


}
}
