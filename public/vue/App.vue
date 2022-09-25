<script setup>
    import { ref } from "vue";
    import Button from 'primevue/button';
    import InputText from 'primevue/inputtext';
    import Slider from 'primevue/slider';
    const count = ref(0);
    const idk = ref("");
</script>

<template>
    <Button @click="count++">
        Count is {{ count }}
    </Button>
    <Slider v-model="count"/>
    <InputText type="text" v-model="idk" />
</template>