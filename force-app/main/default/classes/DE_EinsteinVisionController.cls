public class DE_EinsteinVisionController {   
   @AuraEnabled
   public static String postImageToChatter(String recordId, String docId, String comment) {
       
       System.debug('postImageToChatter ' + recordId + ' - ' + docId + ' - ' + comment);
       // Define the FeedItemInput object to pass to postFeedElement
       ConnectApi.FeedItemInput feedItemInput = new ConnectApi.FeedItemInput();
      // feedItemInput.subjectId = 'me';
       feedItemInput.subjectId = recordId;
       
       ConnectApi.TextSegmentInput textSegmentInput = new ConnectApi.TextSegmentInput();
       textSegmentInput.text = comment;
       
       // The MessageBodyInput object holds the text in the post
       ConnectApi.MessageBodyInput messageBodyInput = new ConnectApi.MessageBodyInput();
       messageBodyInput.messageSegments = new List<ConnectApi.MessageSegmentInput>();
       messageBodyInput.messageSegments.add(textSegmentInput);
       feedItemInput.body = messageBodyInput;
       
       
       // The FeedElementCapabilitiesInput object holds the capabilities of the feed item.
       // For this feed item, we define a files capability to hold the file(s).
       
      List<String> fileIds = new List<String>();
       fileIds.add(docId);
      
       ConnectApi.FilesCapabilityInput filesInput = new ConnectApi.FilesCapabilityInput();
       filesInput.items = new List<ConnectApi.FileIdInput>();
       
       for (String fileId : fileIds) {
           ConnectApi.FileIdInput idInput = new ConnectApi.FileIdInput();
           idInput.id = fileId;
           filesInput.items.add(idInput);
       } 
       
       ConnectApi.FeedElementCapabilitiesInput feedElementCapabilitiesInput = new ConnectApi.FeedElementCapabilitiesInput();
       feedElementCapabilitiesInput.files = filesInput;
       
       feedItemInput.capabilities = feedElementCapabilitiesInput;
       
       // Post the feed item. 
       ConnectApi.FeedElement feedElement = ConnectApi.ChatterFeeds.postFeedElement(Network.getNetworkId(), feedItemInput);
   
   //ConnectApi.FeedElement feedElement = ConnectApi.ChatterFeeds.postFeedElement(Network.getNetworkId(), recordId, ConnectApi.FeedElementType.FeedItem, 'On vacation this week.');
       return 'Success';
   }
   
   
 @AuraEnabled
   public static string createContentUrl(String contentDocumentId) {
          string CD_TEMP_PREFIX = 'Temp';
       integer EXPIRY = 5;

       ContentVersion CV = [select id, Title from ContentVersion where ContentDocumentId =: contentDocumentId and isLatest = true];
       ContentDistribution CD = new ContentDistribution();
       CD.ContentVersionId = CV.Id;
       CD.Name = CD_TEMP_PREFIX + '_' + CV.Title;
       CD.PreferencesAllowOriginalDownload = true;
       CD.PreferencesLinkLatestVersion = true;
       CD.ExpiryDate = system.now().addMinutes(EXPIRY);
       CD.PreferencesExpires = true;
       CD.PreferencesNotifyOnVisit = false;
       CD.PreferencesNotifyRndtnComplete = false;
       insert CD;

       ContentDistribution CD2 = [select id, ContentDownloadUrl from ContentDistribution where Id =: cd.Id];
       return CD2.ContentDownloadUrl;
   }
   
   @AuraEnabled
   public static Map<String,Double> analyseImageUrl(String url, String modelName) {

       // Instantiate an Einstein Prediction Service for image classification from the Playground
       einsteinplay.Einstein_PredictionService service = new einsteinplay.Einstein_PredictionService(einsteinplay.Einstein_PredictionService.Types.IMAGE);
       // Request a prediction from Einstein
       einsteinplay.Einstein_PredictionResult result = service.predictImageUrl(modelId,  url, 3, null); 

       // Check for errors
       if (service.httpStatusCode>200) {
           throw new AuraHandledException(service.httpErrorMessage);
       }

       // Create a map of probability labels and values to return to JavaScript
       Map<String,Double> results=new Map<String,Double>();  
       results.put(result.probabilities[0].label,result.probabilities[0].probability);
       return results;
   }

   


}