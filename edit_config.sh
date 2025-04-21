#\!/usr/bin/env bash
# Script to demonstrate hot-reloading the configuration file
# Run this script while the application is running to see the changes

CONFIG_FILE="$(pwd)/constants/component_renderer_config.json"
echo "Editing configuration file: $CONFIG_FILE"

# Function to modify a JSON property in the config file
modify_property() {
  local property="$1"
  local new_value="$2"
  
  echo "Setting $property to $new_value"
  
  # Use sed to update the property (simplistic approach)
  sed -i '' "s/\"$property\": \"[^\"]*\"/\"$property\": \"$new_value\"/" "$CONFIG_FILE"
  echo "Configuration updated. Watch the application for changes\!"
  echo ""
}

# Main menu
while true; do
  echo "Configuration Hot-Reload Demo"
  echo "----------------------------"
  echo "Choose an option:"
  echo "1. Change background color to red"
  echo "2. Change line entity color to green"
  echo "3. Change circle entity color to blue"
  echo "4. Change selection color to yellow"
  echo "5. Change text color to orange"
  echo "6. Exit"
  
  read -p "Enter your choice [1-6]: " choice
  echo ""
  
  case $choice in
    1) modify_property "background" "#FF0000" ;;
    2) modify_property "color" "#00FF00" ;;
    3) modify_property "color" "#0000FF" ;;
    4) modify_property "selection" "#FFFF00" ;;
    5) modify_property "color" "#FFA500" ;;
    6) echo "Exiting..."; exit 0 ;;
    *) echo "Invalid choice. Please try again." ;;
  esac
  
  # Wait a bit before showing the menu again
  sleep 2
done
