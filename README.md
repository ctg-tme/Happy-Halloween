# Happy Halloween Macro

![Device OSD](/Device-OSD.png)

 - Opens a Halloween Themed WebPage on your Device's OSD 
    - WebPage GitHub Repo > https://github.com/Bobby-McGonigle/HolloweenPumpkinEyes
 - The macro uses PeopleCount Current Data to confirm people are in the room before displaying the page
 - The macro checks for an active call or presentation to avoid disrupting any work in a space
 - The macro no real use other than acts as sample code and a bit of fun. Happy Halloween!

There is a config section at the top of the Macro

```javascript
const config = {
  WebSource: {
    UseDefaultPage: true,       // Use the default HalloweenPumpkinEyes page. If false, will use the CustomPage defined below
    DefaultPage: {
      ShowText: true,           // Show or hide the Text Banner on the Default Page
      Text: 'Happy Halloween',  // Set Custom Text for the Banner on the Default Page
      FontSize: 75              // Change the Font Size on the Default Page
    },
    CustomPage: {
      Url: ''                   // Use a Custom URL instead of the Default Page. config.WebSource.UseDefaultPage must be set to false
    }
  }
}
```