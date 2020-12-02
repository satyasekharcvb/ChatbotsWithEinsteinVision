/* eslint-disable no-console */
import BaseChatMessage from 'lightningsnapin/baseChatMessage';
import { track,api } from 'lwc';
import createContentUrl from '@salesforce/apex/DE_EinsteinVisionController.createContentUrl';
import analyseImageUrl from '@salesforce/apex/DE_EinsteinVisionController.analyseImageUrl';
import postImageToChatter from '@salesforce/apex/DE_EinsteinVisionController.postImageToChatter';

const CHAT_CONTENT_CLASS = 'chat-content';
const AGENT_USER_TYPE = 'agent';
const CHASITOR_USER_TYPE = 'chasitor';
const SUPPORTED_USER_TYPES = [AGENT_USER_TYPE, CHASITOR_USER_TYPE];
/**
 * Displays a chat message using the inherited api messageContent and is styled based on the inherited api userType and messageContent api objects passed in from BaseChatMessage.
 */
export default class ChatMessageDefaultUI extends BaseChatMessage {
    @track messageStyle = '';
    
    @track hasFileUpload=false;
    @track hasOCR=false;
    @track hasFileUploaded=false;
    @api record;
    @api modelId;
    @api objectApiName;
    @track probabilities=[];
    @track predictionLabel;
    @track predictionValue;
    @track contentId;

    @track error;
    @track pictureSrc="https://s3-us-west-1.amazonaws.com/sfdc-demo/image-placeholder.png";
   
    get acceptedFormats() {
        return ['.jpg','.png','.jpeg'];
    }
    isSupportedUserType(userType) {
        return SUPPORTED_USER_TYPES.some((supportedUserType) => supportedUserType === userType);
    }
    handleUploadFinished(event) {
        let uploadedFiles = event.detail.files;
        // eslint-disable-next-line no-console
        console.log("upload finished " + uploadedFiles.length);
        
        
        for(let i=0; i<uploadedFiles.length; i++) {
           // eslint-disable-next-line no-console
           console.log( uploadedFiles[i].name + ' - ' + uploadedFiles[i].documentId );
           this.contentId =  uploadedFiles[i].documentId;
            // eslint-disable-next-line no-console
        console.log("content id -----  " +  this.contentId);
        }
        this.getContentUrl();
        console.log("content url got");

        this.text="Thank you!";
    }
    getContentUrl()
    {
        console.log("calling content method to get content url");
        createContentUrl(
            {
                contentDocumentId:this.contentId
            }
        )
        .then(result => {
            console.log("result----"+result);
            console.log("image url -----"+result);
            this.pictureSrc = result;
            this.analyzeImage(result);

        })
        .catch(error => {
            console.log("errorrrr");
            this.error = error;
        });

    }
    analyzeImage(picUrl)
    {
        console.log("calling Analyze image");

        analyseImageUrl(
            {
                modelName: this.modelId,
                url: picUrl
            }
        )
        .then(result => {
           // console.log(result.data.probabilities);
            let conts=result;
            for(let key in conts){
                this.probabilities.push({value:conts[key], key:key}); //Here we are creating the array to show on UI.
            }
            console.log("label ----"+this.probabilities[0].key);
            console.log("valueee------"+this.probabilities[0].value);
            
            this.predictionLabel=this.probabilities[0].key;
            this.predictionValue=this.probabilities[0].value;
            this.postToChatter(this.probabilities[0].key,this.probabilities[0].value);
            this.hasFileUploaded=true;


        })
        .catch(error => {
            console.log("error in analyze image ....");

            this.error = error;
        });
    }
    postToChatter(label,predictionVal)
    {
        postImageToChatter(
            {
                recordId:this.record,
                docId:this.contentId,
                comment:'Analyzed photo and found it to be ' +label+' with Probability - ' + predictionVal
            }
        )
        .then(result => {
            console.log("result----"+result);
         //   console.log("image url -----"+result);
            //this.pictureSrc = result;
        })
        .catch(error => {
            console.log("errorrrr");
            this.error = error;
        });
    }
    connectedCallback() {
        if (this.isSupportedUserType(this.userType)) {
            this.messageStyle = `${CHAT_CONTENT_CLASS} ${this.userType}`;
            let element = document.createElement();
            element.innerText = this.messageContent.value;
            let values;
            
            if(element.innerText.startsWith("EinsteinVision:"))
            {
                values=element.innerText.split(":");  
                this.objectApiName=values[1];
                this.record=values[2];
                this.modelId=values[3];
                this.hasFileUpload=true;
                this.predictionValue='';
                this.predictionLabel='';
                this.probabilities=[];
            }
            else
            {
                this.hasNoContent=true;
                this.text=this.messageContent.value;
            }
        } else {
            throw new Error(`Unsupported user type passed in: ${this.userType}`);
        }
    }
    
}