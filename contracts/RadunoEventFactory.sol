// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./RadunoEvent.sol";

contract RadunoEventFactory {
    // Store addresses of deployed events
    address[] public allEvents;

    event EventCreated(
        address indexed eventAddress,
        address indexed owner,
        string label
    );

    function createEvent(
        address _realOwner,
        address _l2Registrar,
        address _l2Registry,
        bytes32 _parentNode,
        string memory _label,
        uint256 _capacity,
        string memory _eventName, // nickname
        string memory _description, // description
        string memory _category, // category
        string memory _date, // date
        string memory _location // location
    ) external returns (address) {
        // Deploy new event
        RadunoEvent ev = new RadunoEvent(
            _l2Registrar,
            _l2Registry,
            _parentNode,
            _label,
            _capacity,
            _eventName,
            _description,
            _category,
            _date,
            _location
        );

        // Store and emit
        allEvents.push(address(ev));
        emit EventCreated(address(ev), _realOwner, _label);

        return address(ev);
    }

    // Helper to get count
    function getDeployedEvents() external view returns (address[] memory) {
        return allEvents;
    }
}
