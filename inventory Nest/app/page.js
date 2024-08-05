'use client';
import { useState, useEffect } from 'react';
import { firestore } from "@/inventory Nest/firebase";
import { AppBar, Toolbar, Typography, Box, Modal, Stack, TextField, Button, InputBase, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { collection, query, setDoc, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import { alpha, styled } from '@mui/material/styles';

// SEARCHBAR STYLE
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

const categoryToIcon = {
  'Food': '/images/diet.png',
  'Garage': '/images/garage.png',
  'Kitchen': '/images/kitchen.png',
  'Living Room': '/images/interior-design.png',
  'Bedroom': '/images/bedroom.png',
  'Bathroom': '/images/bathroom.png',
  'Other': '/images/task-list.png',
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [openAssignCategory, setOpenAssignCategory] = useState(false);
  const [itemName, setItemName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState(['Food', 'Garage', 'Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Other']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item, category) => {
    if (!item) return;
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 }, { merge: true });
    } else {
      await setDoc(docRef, { quantity: 1, category: category || '' }, { merge: true });
    }

    await updateInventory();
  };

  const removeItem = async (item) => {
    if (!item) return;
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 }, { merge: true });
      }
    }
    await updateInventory();
  };

  const assignCategory = async () => {
    if (!selectedItem || !selectedCategory) return;
    const docRef = doc(collection(firestore, 'inventory'), selectedItem);
    await setDoc(docRef, { category: selectedCategory }, { merge: true });
    setOpenAssignCategory(false);
    setSelectedItem(null);
    setSelectedCategory('');
    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpenAddItem = () => setOpenAddItem(true);
  const handleCloseAddItem = () => {
    setOpenAddItem(false);
    setItemName('');
    setNewItemCategory('');
  };
  const handleOpenAssignCategory = (item) => {
    setSelectedItem(item);
    setOpenAssignCategory(true);
  };
  const handleCloseAssignCategory = () => setOpenAssignCategory(false);

  const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      gap={2}
      sx={{
        backgroundImage: 'url(/images/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <AppBar position="fixed" sx={{ top: 0 }}>
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            InventoryNest
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Search>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Modal open={openAddItem} onClose={handleCloseAddItem}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Typography variant="h6">Add item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
              }}
            />
              <Button
              variant="outlined"
              size="small"
              onClick={() => {
                addItem(itemName);
                setItemName('');
                handleCloseAddItem();
              }}
            >
              Add item
            </Button>
          </Stack>

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Modal>

      <Modal open={openAssignCategory} onClose={handleCloseAssignCategory}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Typography variant="h6">Assign Category to {selectedItem}</Typography>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={assignCategory}
          >
            Category
          </Button>

        </Box>
      </Modal>

      <Button
        variant="contained"
        size="small"
        onClick={handleOpenAddItem}
      >
        ADD ITEM
      </Button>
      <Box border="1px solid black">
        <Box width="800px" height="100px" bgcolor="#ADD8E6" display="flex" alignItems="center" justifyContent="center">
          <Typography variant="h2" color="#333">
            Inventory Items
          </Typography>
        </Box>
      </Box>

      <Box width="800px" overflow="auto">
        <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={2}>
          {filteredInventory.map((item) => (
            <Box
              key={item.name}
              border="1px solid #ddd"
              borderRadius="8px"
              padding={2}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              boxShadow="0px 4px 8px rgba(0, 0, 0, 0.1)"
              backgroundColor="#ADD8E6"
            >
              <img src={categoryToIcon[item.category] || '/images/default.svg'} alt={item.category} width={40} height={40} />
              <Typography variant="h6">{item.name}</Typography>
              <Typography variant="body1">Quantity: {item.quantity}</Typography>
              <Box display="flex" gap={1} mt={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => addItem(item.name)}
                >
                  +
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => removeItem(item.name)}
                >
                  -
                </Button>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleOpenAssignCategory(item.name)}
                sx={{ mt: 1 }}
              >
                Assign Category
              </Button>
            </Box>
          ))}
        </Box>
      </Box>

    </Box>
  );
}
